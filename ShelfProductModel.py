from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from util.generateuuid import generate_uuid
from models.Base import Base
import datetime


class ShelfProduct(Base):
    """SQL Alchemy model class for ShelfProduct entity"""
    __tablename__ = 'shelfproducts'

    id = Column(String, primary_key=True, default=generate_uuid())
    product = Column(String, ForeignKey('products.id'))
    facings = Column(Integer)
    shelf = Column(String, ForeignKey('shelves.id'))

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def __repr__(self):
        return "<ShelfProduct(product='%s',facings='%d',shelf='%s')>" % (self.product, self.facings, self.shelf)
