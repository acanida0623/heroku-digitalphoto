from django.contrib import admin
from .models import Post, Comment, Image, Album, UserProfile, Friends, Message, MessageBoard
# Register your models here.
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Image)
admin.site.register(Album)
admin.site.register(UserProfile)
admin.site.register(Friends)
admin.site.register(Message)
admin.site.register(MessageBoard)
