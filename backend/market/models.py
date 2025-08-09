from django.db import models
import uuid
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

User = get_user_model()

class Product(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name        = models.CharField(max_length=255)
    description = models.TextField()
    price       = models.DecimalField(max_digits=10, decimal_places=2)
    seller      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    thumbnail   = models.ImageField(upload_to='product_images/')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def average_rating(self):
        reviews = self.reviews.all()
        if reviews.exists():
            return sum([review.rating for review in reviews]) / reviews.count()
        return 0

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product     = models.ForeignKey(Product, related_name="additional_images", on_delete=models.CASCADE)
    image       = models.ImageField(upload_to='product_images/')
    
    def clean(self):
        if self.product.additional_images.count() >= 4:
            raise ValidationError("A product can only have up to 4 additional images.")

    def __str__(self):
        return f"Image for {self.product.name}"



class Review(models.Model):
    product     = models.ForeignKey(Product, related_name="reviews", on_delete=models.CASCADE)
    author      = models.ForeignKey(User, on_delete=models.CASCADE)
    rating      = models.PositiveSmallIntegerField()
    content     = models.TextField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    parent      = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    
    def clean(self):
        if not (1 <= self.rating <= 5):
            raise ValidationError("Rating must be between 1 and 5.")

    def __str__(self):
        # use author (exists) instead of user
        author_name = getattr(self.author, "username", str(self.author))
        return f"Review by {author_name} for {self.product.name}"

