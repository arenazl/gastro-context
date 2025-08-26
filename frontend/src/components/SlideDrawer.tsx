import React, { useEffect, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  icon?: React.ReactNode;
}

interface SlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
  breadcrumb?: BreadcrumbItem[];
  subtitle?: string;
}

export const SlideDrawer: React.FC<SlideDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 'md',
  footer,
  breadcrumb,
  subtitle
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsAnimating(false);
      setTimeout(onClose, 300);
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-out z-50 ${
          isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 transition-all duration-300 ease-out ${
          widthClasses[width]
        } w-full ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          boxShadow: isAnimating ? '-10px 0 40px rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          {/* Breadcrumb */}
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-1 text-sm">
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      {item.icon && (
                        <span className="text-gray-500">{item.icon}</span>
                      )}
                      <span className={index === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : ''}>
                        {item.label}
                      </span>
                    </div>
                    {index < breadcrumb.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
          
          {/* Title bar */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-all hover:rotate-90 duration-200"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto px-6 py-6 ${
          footer ? 'h-[calc(100vh-12rem)]' : 'h-[calc(100vh-8rem)]'
        }`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};