"""
Payment processing API endpoints with Stripe integration.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import stripe
import structlog

from core.database import get_db
from core.auth import get_current_user
from core.config import settings
from models.payment import Payment, PaymentMethod, PaymentStatus
from models.order import Order, OrderStatus
from models.user import User, UserRole
from schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    StripePaymentIntent,
    StripePaymentIntentResponse,
    ProcessPayment,
    RefundRequest,
    PaymentSummary,
    DailySalesReport,
    CashRegisterSession
)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Configure logger
logger = structlog.get_logger()

# Create router
router = APIRouter()


@router.post("/stripe/create-payment-intent", response_model=StripePaymentIntentResponse)
async def create_payment_intent(
    payment_data: StripePaymentIntent,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a Stripe payment intent for card payments.
    """
    # Verify order exists and is not paid
    result = await db.execute(
        select(Order).where(Order.id == payment_data.order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status == OrderStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid"
        )
    
    try:
        # Calculate amount in cents for Stripe
        total_amount = float(order.total_amount + payment_data.tip_amount)
        amount_cents = int(total_amount * 100)
        
        # Create Stripe payment intent
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=payment_data.currency.lower(),
            metadata={
                "order_id": str(payment_data.order_id),
                "restaurant_id": settings.RESTAURANT_ID,
                "cashier_id": str(current_user.id)
            }
        )
        
        # Create payment record in pending state
        payment = Payment(
            order_id=payment_data.order_id,
            amount=order.total_amount + payment_data.tip_amount,
            method=PaymentMethod.CARD,
            status=PaymentStatus.PENDING,
            tip_amount=payment_data.tip_amount,
            cashier_id=current_user.id,
            stripe_payment_intent_id=intent.id
        )
        
        db.add(payment)
        await db.commit()
        
        logger.info(
            "Stripe payment intent created",
            order_id=payment_data.order_id,
            intent_id=intent.id,
            amount=amount_cents
        )
        
        return StripePaymentIntentResponse(
            client_secret=intent.client_secret,
            payment_intent_id=intent.id,
            amount=amount_cents,
            currency=payment_data.currency
        )
        
    except stripe.error.StripeError as e:
        logger.error("Stripe error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment processing error: {str(e)}"
        )


@router.post("/process", response_model=PaymentResponse)
async def process_payment(
    payment_data: ProcessPayment,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a payment for an order (cash or confirmed card payment).
    """
    # Get order with payment
    result = await db.execute(
        select(Order).where(Order.id == payment_data.order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if payment already exists
    result = await db.execute(
        select(Payment).where(Payment.order_id == payment_data.order_id)
    )
    payment = result.scalar_one_or_none()
    
    if payment and payment.status == PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already paid"
        )
    
    # If payment exists (from Stripe intent), update it
    if payment:
        payment.status = PaymentStatus.COMPLETED
        payment.paid_at = datetime.utcnow()
        payment.tip_amount = payment_data.tip_amount
    else:
        # Create new payment (for cash)
        payment = Payment(
            order_id=payment_data.order_id,
            amount=order.total_amount + payment_data.tip_amount,
            method=PaymentMethod.CASH,
            status=PaymentStatus.COMPLETED,
            tip_amount=payment_data.tip_amount,
            cashier_id=current_user.id,
            paid_at=datetime.utcnow()
        )
        db.add(payment)
    
    # Update order status
    order.status = OrderStatus.PAID
    order.paid_at = datetime.utcnow()
    order.tip_amount = payment_data.tip_amount
    
    await db.commit()
    await db.refresh(payment)
    
    logger.info(
        "Payment processed",
        payment_id=payment.id,
        order_id=payment_data.order_id,
        method=payment.method.value
    )
    
    return payment


@router.post("/refund", response_model=PaymentResponse)
async def refund_payment(
    refund_data: RefundRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a refund for a payment.
    """
    # Check user permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for refunds"
        )
    
    # Get payment
    result = await db.execute(
        select(Payment).where(Payment.id == refund_data.payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if not payment.can_refund:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment cannot be refunded"
        )
    
    try:
        # Process Stripe refund if card payment
        if payment.method == PaymentMethod.CARD and payment.stripe_charge_id:
            refund_amount = refund_data.amount or payment.amount
            refund = stripe.Refund.create(
                charge=payment.stripe_charge_id,
                amount=int(float(refund_amount) * 100),
                reason="requested_by_customer"
            )
            
            logger.info(
                "Stripe refund processed",
                refund_id=refund.id,
                payment_id=payment.id
            )
        
        # Update payment status
        payment.status = PaymentStatus.REFUNDED
        payment.refunded_at = datetime.utcnow()
        
        # Update order status
        result = await db.execute(
            select(Order).where(Order.id == payment.order_id)
        )
        order = result.scalar_one()
        order.status = OrderStatus.CANCELLED
        
        await db.commit()
        await db.refresh(payment)
        
        return payment
        
    except stripe.error.StripeError as e:
        logger.error("Stripe refund error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Refund processing error: {str(e)}"
        )


@router.get("/order/{order_id}", response_model=Optional[PaymentResponse])
async def get_order_payment(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get payment information for an order.
    """
    result = await db.execute(
        select(Payment).where(Payment.order_id == order_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        return None
    
    return payment


@router.get("/summary/{order_id}", response_model=PaymentSummary)
async def get_payment_summary(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get payment summary for an order.
    """
    # Get order and payment
    result = await db.execute(
        select(Order, Payment)
        .join(Payment, Payment.order_id == Order.id, isouter=True)
        .where(Order.id == order_id)
    )
    row = result.first()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order, payment = row
    
    return PaymentSummary(
        total_amount=order.total_amount,
        subtotal=order.subtotal,
        tax_amount=order.tax_amount,
        tip_amount=order.tip_amount,
        discount_amount=order.discount_amount,
        payment_method=payment.method if payment else None,
        status=payment.status if payment else PaymentStatus.PENDING
    )


@router.get("/reports/daily", response_model=DailySalesReport)
async def get_daily_sales_report(
    date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get daily sales report.
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Use today if no date provided
    if not date:
        date = datetime.utcnow().date()
    else:
        date = date.date()
    
    start_date = datetime.combine(date, datetime.min.time())
    end_date = datetime.combine(date, datetime.max.time())
    
    # Get all payments for the day
    result = await db.execute(
        select(Payment)
        .where(
            and_(
                Payment.paid_at >= start_date,
                Payment.paid_at <= end_date,
                Payment.status == PaymentStatus.COMPLETED
            )
        )
    )
    payments = result.scalars().all()
    
    # Calculate statistics
    total_sales = sum(p.amount for p in payments)
    total_orders = len(payments)
    total_tips = sum(p.tip_amount for p in payments)
    
    # Group by payment method
    payment_methods = {}
    for payment in payments:
        method = payment.method.value
        if method not in payment_methods:
            payment_methods[method] = Decimal(0)
        payment_methods[method] += payment.amount
    
    average_order_value = total_sales / total_orders if total_orders > 0 else Decimal(0)
    
    return DailySalesReport(
        date=date,
        total_sales=total_sales,
        total_orders=total_orders,
        total_tips=total_tips,
        payment_methods=payment_methods,
        average_order_value=average_order_value
    )


@router.post("/cash-register/open", response_model=CashRegisterSession)
async def open_cash_register(
    opening_amount: Decimal,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Open cash register session.
    """
    if current_user.role not in [UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only cashiers can open register"
        )
    
    # Check if there's already an open session
    # This would require a CashRegister model - simplified for now
    
    session = CashRegisterSession(
        opening_amount=opening_amount,
        cashier_id=current_user.id,
        opened_at=datetime.utcnow()
    )
    
    logger.info(
        "Cash register opened",
        cashier_id=current_user.id,
        opening_amount=float(opening_amount)
    )
    
    return session


@router.post("/cash-register/close", response_model=CashRegisterSession)
async def close_cash_register(
    actual_cash: Decimal,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Close cash register session and reconcile.
    """
    if current_user.role not in [UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only cashiers can close register"
        )
    
    # Calculate expected cash from today's transactions
    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(
            and_(
                Payment.method == PaymentMethod.CASH,
                Payment.status == PaymentStatus.COMPLETED,
                Payment.paid_at >= today_start,
                Payment.cashier_id == current_user.id
            )
        )
    )
    expected_cash = result.scalar() or Decimal(0)
    
    difference = actual_cash - expected_cash
    
    session = CashRegisterSession(
        opening_amount=Decimal(0),  # Would come from morning session
        closing_amount=actual_cash,
        expected_cash=expected_cash,
        actual_cash=actual_cash,
        difference=difference,
        cashier_id=current_user.id,
        opened_at=today_start,
        closed_at=datetime.utcnow()
    )
    
    logger.info(
        "Cash register closed",
        cashier_id=current_user.id,
        expected=float(expected_cash),
        actual=float(actual_cash),
        difference=float(difference)
    )
    
    return session


@router.get("/history", response_model=List[PaymentResponse])
async def get_payment_history(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get payment history with optional date filtering.
    """
    query = select(Payment)
    
    # Add date filters if provided
    filters = []
    if start_date:
        filters.append(Payment.paid_at >= start_date)
    if end_date:
        filters.append(Payment.paid_at <= end_date)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Order by most recent first
    query = query.order_by(Payment.paid_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    payments = result.scalars().all()
    
    return payments