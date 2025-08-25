"""
Base model mixins and utilities.
"""
from sqlalchemy import Column, DateTime, func
from sqlalchemy.ext.declarative import declared_attr


class TimestampMixin:
    """Mixin for adding created_at and updated_at timestamps to models"""
    
    @declared_attr
    def created_at(cls):
        return Column(DateTime, server_default=func.now(), nullable=False)
    
    @declared_attr
    def updated_at(cls):
        return Column(
            DateTime,
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False
        )


# MySQL table configuration
mysql_table_args = {
    'mysql_engine': 'InnoDB',
    'mysql_charset': 'utf8mb4',
    'mysql_collate': 'utf8mb4_unicode_ci'
}