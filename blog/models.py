from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Post(models.Model):
    author = models.ForeignKey('auth.User')
    title = models.CharField(max_length=200)
    text = models.TextField()
    created_date = models.DateTimeField(
            default=timezone.now)
    published_date = models.DateTimeField(
            blank=True, null=True)

    def publish(self):
        self.published_date = timezone.now()
        self.save()

    def __str__(self):
        return self.title

class Comment(models.Model):
    post = models.ForeignKey('blog.Post', related_name='comments')
    author = models.CharField(max_length=200)
    text = models.TextField()
    created_date = models.DateTimeField(default=timezone.now)
    approved_comment = models.BooleanField(default=False)

    def approve(self):
        self.approved_comment = True
        self.save()

    def __str__(self):
        return self.text

    def approved_comments(self):
        return self.comments.filter(approved_comment=True)



class UserProfile(models.Model):
    user =  models.OneToOneField(User, unique=True, null = True)
    picture = models.URLField(null = True)

class Message(models.Model):
    content = models.TextField(null=True)
    owner = models.ForeignKey(UserProfile, null = True, related_name="board_owner")
    created_date = models.DateTimeField(default=timezone.now)

class MessageBoard(models.Model):
    user1 = models.ForeignKey(UserProfile, null = True, related_name="first_user")
    user2 = models.ForeignKey(UserProfile, null = True, related_name="second_user")
    messages = models.ManyToManyField(Message,related_name="boards_messages",blank=True)

class Friends(models.Model):
    owner = models.ForeignKey(UserProfile, null = True, related_name="friends_owner")
    friends = models.ManyToManyField(UserProfile,related_name="friends_list",blank=True)
    requests_received = models.ManyToManyField(UserProfile,related_name="friends_requests_received",blank=True)
    requests_sent = models.ManyToManyField(UserProfile,related_name="friends_requests_sent",blank=True)

class Image(models.Model):
    author = models.ForeignKey(UserProfile, null = True)
    url = models.URLField()
    album_name = models.CharField(max_length=200, null = True)
    row = models.CharField(max_length=200, null=True)
    created_date = models.DateTimeField(default=timezone.now)

class Album(models.Model):
    author = models.ForeignKey(UserProfile, null = True)
    users = models.ManyToManyField(UserProfile,related_name="tagged_users",blank=True)
    images = models.ManyToManyField(Image)
    name = models.CharField(max_length=200, unique=True, null = True)
    created_date = models.DateTimeField(default=timezone.now)

    def Publish(self):
        self.save()
