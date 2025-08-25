"""Initial schema creation

Revision ID: 001
Revises: 
Create Date: 2025-08-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('role', sa.Enum('admin', 'manager', 'waiter', 'kitchen', 'cashier', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('hire_date', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=True),
        sa.Column('locked_until', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        mysql_engine='InnoDB'
    )
    op.create_index('idx_users_email', 'users', ['email'], unique=False)
    op.create_index('idx_users_role_active', 'users', ['role', 'is_active'], unique=False)

    # Create categories table
    op.create_table('categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        mysql_engine='InnoDB'
    )
    op.create_index('idx_categories_active', 'categories', ['is_active'], unique=False)
    op.create_index('idx_categories_display_order', 'categories', ['display_order'], unique=False)

    # Create ingredients table
    op.create_table('ingredients',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('unit_type', sa.String(length=20), nullable=False),
        sa.Column('cost_per_unit', sa.DECIMAL(precision=10, scale=4), nullable=False),
        sa.Column('current_stock', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('min_stock_alert', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('max_stock', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('supplier', sa.String(length=200), nullable=True),
        sa.Column('supplier_code', sa.String(length=100), nullable=True),
        sa.Column('expiry_date', sa.DateTime(), nullable=True),
        sa.Column('days_until_expiry_alert', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        mysql_engine='InnoDB'
    )
    op.create_index('idx_ingredients_name', 'ingredients', ['name'], unique=False)
    op.create_index('idx_ingredients_stock_alert', 'ingredients', ['current_stock', 'min_stock_alert'], unique=False)
    op.create_index('idx_ingredients_supplier', 'ingredients', ['supplier'], unique=False)

    # Create tables table
    op.create_table('tables',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('number', sa.Integer(), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=False),
        sa.Column('location', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('position_x', sa.Integer(), nullable=True),
        sa.Column('position_y', sa.Integer(), nullable=True),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('current_status', sa.Enum('available', 'occupied', 'reserved', 'cleaning', name='tablestatus'), nullable=True),
        sa.Column('current_order_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('number'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        mysql_engine='InnoDB'
    )
    op.create_index('idx_tables_location_active', 'tables', ['location', 'is_active'], unique=False)
    op.create_index('idx_tables_number', 'tables', ['number'], unique=False)

    # Create products table
    op.create_table('products',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('base_price', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('cost_price', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('preparation_time', sa.Integer(), nullable=False),
        sa.Column('is_available', sa.Boolean(), nullable=False),
        sa.Column('requires_kitchen', sa.Boolean(), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('is_featured', sa.Boolean(), nullable=True),
        sa.Column('allergens', sa.JSON(), nullable=True),
        sa.Column('nutritional_info', sa.JSON(), nullable=True),
        sa.Column('calories', sa.Integer(), nullable=True),
        sa.Column('slug', sa.String(length=250), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        mysql_engine='InnoDB'
    )
    op.create_index('idx_products_category_available', 'products', ['category_id', 'is_available'], unique=False)
    op.create_index('idx_products_featured', 'products', ['is_featured'], unique=False)
    op.create_index('idx_products_name', 'products', ['name'], unique=False)
    op.create_index('idx_products_price_range', 'products', ['base_price'], unique=False)

    # Create orders table
    op.create_table('orders',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('table_number', sa.Integer(), nullable=False),
        sa.Column('waiter_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'preparing', 'ready', 'delivered', 'cancelled', 'paid', name='orderstatus'), nullable=False),
        sa.Column('subtotal', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('tax_amount', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('discount_amount', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('tip_amount', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('total_amount', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('ordered_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('kitchen_notified_at', sa.DateTime(), nullable=True),
        sa.Column('preparation_started_at', sa.DateTime(), nullable=True),
        sa.Column('ready_at', sa.DateTime(), nullable=True),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('customer_name', sa.String(length=200), nullable=True),
        sa.Column('customer_phone', sa.String(length=20), nullable=True),
        sa.Column('customer_email', sa.String(length=255), nullable=True),
        sa.Column('customer_notes', sa.Text(), nullable=True),
        sa.Column('kitchen_notes', sa.Text(), nullable=True),
        sa.Column('internal_notes', sa.Text(), nullable=True),
        sa.Column('order_type', sa.Enum('dine_in', 'takeout', 'delivery', name='ordertype'), nullable=True),
        sa.Column('priority_level', sa.Integer(), nullable=True),
        sa.Column('estimated_ready_time', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['table_number'], ['tables.number'], ),
        sa.ForeignKeyConstraint(['waiter_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        mysql_engine='InnoDB'
    )
    op.create_index('idx_orders_daily_reports', 'orders', ['ordered_at'], unique=False)
    op.create_index('idx_orders_status_created', 'orders', ['status', 'created_at'], unique=False)
    op.create_index('idx_orders_table_status', 'orders', ['table_number', 'status'], unique=False)
    op.create_index('idx_orders_waiter_date', 'orders', ['waiter_id', 'created_at'], unique=False)

    # Create product_ingredients table
    op.create_table('product_ingredients',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('ingredient_id', sa.Integer(), nullable=False),
        sa.Column('quantity_needed', sa.DECIMAL(precision=10, scale=4), nullable=False),
        sa.Column('is_optional', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['ingredient_id'], ['ingredients.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        mysql_engine='InnoDB'
    )
    op.create_index('idx_product_ingredients_ingredient', 'product_ingredients', ['ingredient_id'], unique=False)
    op.create_index('idx_product_ingredients_product', 'product_ingredients', ['product_id'], unique=False)

    # Create product_variants table
    op.create_table('product_variants',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('price_modifier', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('is_available', sa.Boolean(), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        mysql_engine='InnoDB'
    )
    op.create_index('idx_variants_available', 'product_variants', ['is_available'], unique=False)
    op.create_index('idx_variants_product_type', 'product_variants', ['product_id', 'type'], unique=False)

    # Create payments table
    op.create_table('payments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('method', sa.Enum('cash', 'card', 'transfer', 'digital_wallet', name='paymentmethod'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'completed', 'failed', 'refunded', name='paymentstatus'), nullable=False),
        sa.Column('stripe_payment_intent_id', sa.String(length=200), nullable=True),
        sa.Column('stripe_charge_id', sa.String(length=200), nullable=True),
        sa.Column('stripe_customer_id', sa.String(length=200), nullable=True),
        sa.Column('stripe_payment_method_id', sa.String(length=200), nullable=True),
        sa.Column('tip_amount', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('cashier_id', sa.Integer(), nullable=True),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('refunded_at', sa.DateTime(), nullable=True),
        sa.Column('invoice_number', sa.String(length=100), nullable=True),
        sa.Column('tax_info', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['cashier_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        mysql_engine='InnoDB'
    )
    op.create_index('idx_payments_date_reports', 'payments', ['paid_at'], unique=False)
    op.create_index('idx_payments_order', 'payments', ['order_id'], unique=False)
    op.create_index('idx_payments_status_method', 'payments', ['status', 'method'], unique=False)
    op.create_index('idx_payments_stripe_intent', 'payments', ['stripe_payment_intent_id'], unique=False)

    # Create order_items table
    op.create_table('order_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('variant_id', sa.Integer(), nullable=True),
        sa.Column('modifications', sa.JSON(), nullable=True),
        sa.Column('special_notes', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'preparing', 'ready', 'delivered', 'cancelled', name='orderitemstatus'), nullable=False),
        sa.Column('kitchen_notes', sa.Text(), nullable=True),
        sa.Column('started_preparing_at', sa.DateTime(), nullable=True),
        sa.Column('ready_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        mysql_engine='InnoDB'
    )
    op.create_index('idx_order_items_order_status', 'order_items', ['order_id', 'status'], unique=False)
    op.create_index('idx_order_items_product', 'order_items', ['product_id'], unique=False)

    # Add foreign key constraint for tables.current_order_id
    op.create_foreign_key('fk_tables_current_order', 'tables', 'orders', ['current_order_id'], ['id'])

    # Create additional performance indexes
    op.execute('CREATE INDEX idx_orders_kitchen_workflow ON orders(status, ordered_at, table_number);')
    op.execute('CREATE INDEX idx_order_items_kitchen_prep ON order_items(status, created_at);')
    op.execute('CREATE INDEX idx_payments_daily_sales ON payments(paid_at, method, status);')
    op.execute('CREATE INDEX idx_products_menu_display ON products(category_id, is_available, display_order);')


def downgrade() -> None:
    # Drop tables in reverse order due to foreign key constraints
    op.drop_table('order_items')
    op.drop_table('payments')
    op.drop_table('product_variants')
    op.drop_table('product_ingredients')
    op.drop_table('orders')
    op.drop_table('products')
    op.drop_table('tables')
    op.drop_table('ingredients')
    op.drop_table('categories')
    op.drop_table('users')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS userrole;')
    op.execute('DROP TYPE IF EXISTS tablestatus;')
    op.execute('DROP TYPE IF EXISTS orderstatus;')
    op.execute('DROP TYPE IF EXISTS ordertype;')
    op.execute('DROP TYPE IF EXISTS orderitemstatus;')
    op.execute('DROP TYPE IF EXISTS paymentmethod;')
    op.execute('DROP TYPE IF EXISTS paymentstatus;')