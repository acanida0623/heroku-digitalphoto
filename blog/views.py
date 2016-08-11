from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render_to_response
from django.utils import timezone
from .models import Image, Album, UserProfile, Friends, Message, MessageBoard
from .forms import UserCreationForm, UserProfilePicture
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.db.models import Count
import json
from django.template import RequestContext
from django.contrib.auth import authenticate, login, logout
import boto3
from boto3.s3.transfer import S3Transfer
import base64
import uuid
import os
from boto.s3.connection import S3Connection, Bucket, Key
import sys

# AWS_ACCESS_KEY = os.environ['AWS_ACCESS_KEY']
# AWS_SECRET_KEY = os.environ['AWS_SECRET_KEY']
AWS_BUCKET_NAME = 'cloudimgs'

def upload_img(request):
    if request.is_ajax():
        if request.method == 'POST':
            uuid_key = uuid.uuid4()
            uuid_key = str(uuid_key)
            uuid_key = uuid_key[0:8]
            img_in_bytes = base64.b64decode(request.POST['image'])
            mime_type = request.POST['mime_type']
            c = boto3.client('s3', 'us-west-2')
            p = c.put_object(Body=img_in_bytes,Bucket=AWS_BUCKET_NAME,Key=uuid_key,ACL="public-read",ContentType=mime_type)
            url = "https://s3-us-west-2.amazonaws.com/{bucket}/{key}".format(bucket=AWS_BUCKET_NAME,key=uuid_key)
            response = {'url':url}
            return HttpResponse( json.dumps(response) )

def login_home(request):
    return render(request, 'login.html', {
    })

def login_user(request):
    username = ''
    password = ''
    if request.POST:
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(username=username, password=password)
        login(request,user)
        if user is not None:
            if user.is_active:
                return redirect('/')
    return render(request, 'main_view.html', {
    })

def logout_the_user(request):
    logout(request)
    return redirect('/accounts/login')


@login_required(login_url='/accounts/login/')
def main_view(request):
    return render(request, 'main_view.html', {
    })

def new_account(request):
    form = UserCreationForm()
    formb = UserProfilePicture()
    return render(request, 'new_user.html',{'form': form,
                                            'formb': formb })

@csrf_exempt
def submit_new_account(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        formb = UserProfilePicture(request.POST)
        if form.is_valid():
            print("forma valid")
            if formb.is_valid():
                print("formb is valid")
                UserProfile.objects.create(user = form.save(commit = True),picture = request.POST.get('picture', False))
                user = UserProfile.objects.get(user__username=form.cleaned_data.get("username"))
                Friends.objects.create(owner=user)

                return redirect('/')
    else:
        form = UserCreationForm()
        formb = UserProfilePicture()
    return render(request,'new_user.html', {'form': form,
                                            'formb': formb })

def upload_images(request):
    return render(request, 'upload.html')


@login_required
def new_album(request):
    user = UserProfile.objects.get(user__username=request.user)
    req = request.body.decode("utf-8")
    req = eval(req)
    album_name = req['album_name']
    users = req['users']
    if request.method == "POST":
        same_name = Album.objects.filter(name=album_name, author=user)
        if same_name.exists():
            for x in same_name:
                error = "Album Name Exists"
                return HttpResponse(json.dumps(error))
        else:
            new_album = Album(author=user,name=album_name)
            new_album.save()
            for name in users:
                print(name)
                try:
                    friend = UserProfile.objects.filter(user__username=name)
                    new_album.users.add(friend)
                    new_album.save()
                except:
                    print('')
            new_image = Image(url="http://i.imgur.com/wFpjb8w.jpg",author=user,album_name=new_album.name)
            new_image.save()
            new_album.images.add(new_image)
            new_album.save()
            success = "Success!"
            return HttpResponse(
            json.dumps(success)
            )

@login_required
def edit_album(request):
    if request.is_ajax():
        user = UserProfile.objects.get(user__username=request.user)
        req = request.body.decode("utf-8")
        req = eval(req)
        album_name = req['album_name']
        new_album_name = req['new_album_name']
        print(album_name)
        friends = req['users']
        if request.method == "POST":
            album_to_edit = Album.objects.get(name=album_name, author=user)
            album_to_edit.users.clear()
            for name in friends:
                try:
                    friend = UserProfile.objects.get(user__username=name)
                    album_to_edit.users.add(friend)
                    album_to_edit.save()
                except:
                    print('')
            try:
                setattr(album_to_edit, 'name', new_album_name)
                album_to_edit.save()
            except:
                print('Album name exists')
            return HttpResponse(
            json.dumps('success')
            )

def save_urls(request):
    if request.is_ajax():
        req = eval(request.body)
        if request.method == 'POST':
            album = Album.objects.filter(name=req['album'])
            user = str(request.user)
            user_profile = UserProfile.objects.get(user__username=request.user)
            images = []
            album_friends = []
            for x in album:
                if x.author == user_profile or user in x.users:
                    url_list = Image(author=user_profile,url=req['url'],album_name=req['album'])
                    url_list.save()
                    x.images.add(url_list)
                    x.save()
                    img = x.images.all()
                    for y in img:
                        images.append(y.url)
                    for f in x.users.all():
                        album_friends.append(f.user.username)
            print(album_friends)
            print("!@#$%#@%$#@%@#")
            user = str(request.user)
            album_url_list = fill_albums(user,"a-z","")
            done = {'album':req['album'], 'images':images, 'author':user, 'albums':album_url_list, 'album_friends':album_friends}
            return HttpResponse( json.dumps(done) )

@csrf_exempt
def delete_url(request):
    if request.is_ajax():
        req = eval(request.body)
        if request.method == 'POST':
            user = UserProfile.objects.get(user__username=request.user)
            # conn = S3Connection(AWS_ACCESS_KEY, AWS_SECRET_KEY)
            # b = Bucket(conn, AWS_BUCKET_NAME)
            # k = Key(b)
            for x in req['url']:
                x = str(x)
                # k.key = x[-8:]
                # b.delete_key(k)
                url_list = Image.objects.get(author=user,url=x,album_name=req['album'])
                album = Album.objects.get(author=user,name=req['album'])
                album.images.remove(url_list)
                album.save()
                url_list.delete()
            return HttpResponse( request )

def get_urls(request):
    if request.is_ajax():
        if request.method == 'GET':
            url_list = []
            for name in Image.objects.filter(author=request.user):
                url_list.append(name.url)
            return HttpResponse(
            json.dumps(url_list)
            )

def get_friends(request):
    if request.is_ajax():
        if request.method == 'GET':
            friends_list = []
            user = UserProfile.objects.get(user__username = request.user)
            try:
                user_friends = Friends.objects.get(owner = user)
                for f in user_friends.friends.all():
                    friends_list.append({'name':f.user.username,'url':f.picture})
                return HttpResponse(
                json.dumps(friends_list)
                )
            except:
                no_friends = False
                return HttpResponse(
                json.dumps(no_friends)
                )

def get_all_users(request):
    if request.is_ajax():
        if request.method == 'GET':
            user_list = []
            current_user_name = str(request.user)
            friends_list = []
            requests_received = []
            current_user = UserProfile.objects.get(user__username = request.user)
            user_friends = Friends.objects.get(owner = current_user)
            for f in user_friends.friends.all():
                friends_list.append(f.user.username)
            for f in user_friends.requests_received.all():
                requests_received.append(f.user.username)
            for user in  UserProfile.objects.all():
                if user.user.username != current_user_name:
                    if user.user.username not in friends_list:
                        if user.user.username not in requests_received:
                            user_list.append({'name':user.user.username,'url':user.picture,'lower_name':user.user.username.lower()})
            return HttpResponse(
            json.dumps(user_list)
            )

def get_user(request):
    if request.is_ajax():
        if request.method == 'GET':
            user_name = str(request.user)
            user = UserProfile.objects.get(user__username=request.user)
            profile_picture = user.picture
            result = {'user_name':user_name,'profile_picture':profile_picture}
            return HttpResponse(
            json.dumps(result)
            )


def save_friend(request):
    if request.is_ajax():
        if request.method == 'POST':
            user = UserProfile.objects.get(user__username=request.user)
            req = request.body.decode("utf-8")
            req = eval(req)
            current_user_name = str(request.user)
            friend_request = req['friend_request']
            friend = UserProfile.objects.get(user__username=friend_request)
            new_board = MessageBoard.objects.create(user1=user,user2=friend)
            new_message = Message.objects.create(owner=user,content="hello")
            new_board.messages.add(new_message)
            new_board.save()
            user_friends = Friends.objects.get(owner = user)
            user_friends.friends.add(friend)
            user_friends.requests_received.remove(friend)
            user_friends.save()
            friends_friends =  Friends.objects.get(owner = friend)
            friends_friends.friends.add(user)
            friends_friends.requests_sent.remove(user)
            friends_friends.save()
            friends_list = []
            friends_compare = []
            requests_received = []
            user_list = []
            friend_requests = {'sent':[],'received':[]}
            for f in user_friends.friends.all():
                friends_list.append({'name':f.user.username,'url':f.picture})
                friends_compare.append(f.user.username)
            for f in user_friends.requests_received.all():
                friend_requests['received'].append({'name':f.user.username,'url':f.picture})
                requests_received.append(f.user.username)
            for f in user_friends.requests_sent.all():
                friend_requests['sent'].append({'name':f.user.username})
            for users in  UserProfile.objects.all():
                if users.user.username != current_user_name:
                    if users.user.username not in friends_compare:
                        if users.user.username not in requests_received:
                            user_list.append({'name':users.user.username,'url':users.picture,'lower_name':users.user.username.lower()})
            result = {'requests':friend_requests,'friends':friends_list,'global_users':user_list}
            print(result)
            return  HttpResponse(
            json.dumps(result)
            )


def get_messageboard(request):
    if request.is_ajax():
        if request.method == 'GET':
            friend_name = request.GET.get("friend")
            user = UserProfile.objects.get(user__username=request.user)
            friend = UserProfile.objects.get(user__username=friend_name)
            try:
                message_board = MessageBoard.objects.get(user1=user,user2=friend)
            except:
                message_board = MessageBoard.objects.get(user1=friend,user2=user)
            messages = []
            try:
                for message in message_board.messages.all().order_by(""+"created_date"):
                    messages.append({'owner':message.owner.user.username,'content':message.content})
                    print(messages)
            except:
                print("no messages")
            return HttpResponse(
            json.dumps(messages)
            )

def send_message(request):
    if request.is_ajax():
        if request.method == 'POST':
            user = UserProfile.objects.get(user__username=request.user)
            reque = request.body.decode("utf-8")
            req = eval(reque)
            friend_name = req['friend']
            message_content = req['message']
            print("!@#!@#!@#!")
            friend = UserProfile.objects.get(user__username=friend_name)
            try:
                message_board = MessageBoard.objects.get(user1=user,user2=friend)
            except:
                message_board = MessageBoard.objects.get(user1=friend,user2=user)
            new_message = Message.objects.create(owner=user,content=message_content)
            message_board.messages.add(new_message)
            message_board.save()
            messages=[]
            try:
                for message in message_board.messages.all().order_by(""+"created_date"):
                    messages.append({'owner':message.owner.user.username,'content':message.content})
            except:
                print("no messages")
            return HttpResponse(
            json.dumps(messages)
            )

def send_friend_request(request):
    if request.is_ajax():
        if request.method == 'POST':
            user = UserProfile.objects.get(user__username=request.user)
            reque = request.body.decode("utf-8")
            req = eval(reque)
            friend_request = req['friend_request']
            friend = UserProfile.objects.get(user__username=friend_request)
            user_friends = Friends.objects.get(owner = user)
            user_friends.requests_sent.add(friend)
            user_friends.save()
            friends_friends =  Friends.objects.get(owner = friend)
            friends_friends.requests_received.add(user)
            friends_friends.save()
            friend_requests = {'sent':[],'received':[]}
            for f in user_friends.requests_received.all():
                friend_requests['received'].append({'name':f.user.username,'url':f.picture})
            for f in user_friends.requests_sent.all():
                friend_requests['sent'].append({'name':f.user.username})
            return  HttpResponse(
            json.dumps(friend_requests)
            )

def delete_friend_request(request):
    if request.is_ajax():
        if request.method == 'POST':
            user = UserProfile.objects.get(user__username=request.user)
            reque = request.body.decode("utf-8")
            req = eval(reque)
            friend_request = req['friend_request']
            friend = UserProfile.objects.get(user__username=friend_request)
            user_friends = Friends.objects.get(owner = user)
            user_friends.requests_sent.remove(friend)
            user_friends.save()
            friends_friends =  Friends.objects.get(owner = friend)
            friends_friends.requests_received.remove(user)
            friends_friends.save()
            friend_requests = {'sent':[],'received':[]}
            for f in user_friends.requests_received.all():
                friend_requests['received'].append({'name':f.user.username,'url':f.picture})
            for f in user_friends.requests_sent.all():
                friend_requests['sent'].append({'name':f.user.username})
            return  HttpResponse(
            json.dumps(friend_requests)
            )

def deny_friend_request(request):
    if request.is_ajax():
        if request.method == 'POST':
            current_user_name = str(request.user)
            user = UserProfile.objects.get(user__username=request.user)
            reque = request.body.decode("utf-8")
            req = eval(reque)
            friend_request = req['friend_request']
            friend = UserProfile.objects.get(user__username=friend_request)
            user_friends = Friends.objects.get(owner = user)
            user_friends.requests_received.remove(friend)
            user_friends.save()
            friends_friends =  Friends.objects.get(owner = friend)
            friends_friends.requests_sent.remove(user)
            friends_friends.save()
            friends_compare = []
            requests_received = []
            user_list = []
            friend_requests = {'sent':[],'received':[],'global_users':[]}
            for f in user_friends.friends.all():
                friends_compare.append(f.user.username)
            for f in user_friends.requests_received.all():
                friend_requests['received'].append({'name':f.user.username,'url':f.picture})
                requests_received.append(f.user.username)
            for f in user_friends.requests_sent.all():
                friend_requests['sent'].append({'name':f.user.username})
            for users in  UserProfile.objects.all():
                if users.user.username != current_user_name:
                    if users.user.username not in friends_compare:
                        if users.user.username not in requests_received:
                            friend_requests['global_users'].append({'name':users.user.username,'url':users.picture,'lower_name':users.user.username.lower()})
            return  HttpResponse(
            json.dumps(friend_requests)
            )

def get_friend_requests(request):
    if request.is_ajax():
        if request.method == 'GET':
            friend_requests = {'sent':[],'received':[]}
            user = UserProfile.objects.get(user__username = request.user)
            user_friends = Friends.objects.get(owner = user)
            for f in user_friends.requests_received.all():
                friend_requests['received'].append({'name':f.user.username,'url':f.picture})
            for f in user_friends.requests_sent.all():
                friend_requests['sent'].append({'name':f.user.username})
            return HttpResponse(
            json.dumps(friend_requests)
            )

def get_friend_albums(request):
    if request.is_ajax():
        if request.method == 'GET':
            album_url_list = {'friends_albums':[],'users_albums':[]}
            user = str(request.user)
            friend = request.GET.get("friend")
            for name in Album.objects.all().order_by(""+'name'):
                author = str(name.author.user)
                if friend == author:
                    for shared_user in name.users.all():
                        if user == shared_user.user.username:

                            urls = list(name.images.all().order_by('?'))
                            images = []
                            friends = []
                            for x in urls:
                                images.append(x.url)
                            for f in name.users.all():
                                friends.append(f.user.username)
                            album_url_list['friends_albums'].append({'urls':images,'name':name.name,'author':author,'friends':friends})
                if user == author:
                    for shared_user in name.users.all():
                        if friend == shared_user.user.username:
                            urls = list(name.images.all().order_by('?'))
                            images = []
                            friends = []
                            for x in urls:
                                images.append(x.url)
                            for f in name.users.all():
                                friends.append(f.user.username)
                            album_url_list['users_albums'].append({'urls':images,'name':name.name,'author':author,'friends':friends})
            result = {'album_url_list':album_url_list}
            return HttpResponse(
            json.dumps(result)
            )

def get_albums(request):
    uuid_key = uuid.uuid4()
    if request.is_ajax():
        if request.method == 'GET':
            sorting_method = request.GET.get("sorting_method")
            direction = request.GET.get("direction")
            user_name = str(request.user)
            user = UserProfile.objects.get(user__username=request.user)
            profile_picture = user.picture
            album_url_list = fill_albums(user_name,sorting_method,direction)
            result = {'album_url_list':album_url_list,'user':user_name,'picture':profile_picture}
            return HttpResponse(
            json.dumps(result)
            )



def fill_albums(user,sorting_method,direction):
    album_url_list = {'user_albums':[],'contr_albums':[]}
    if sorting_method == "image_count":
        for name in Album.objects.annotate(entry_count=Count('images')).order_by(direction+'entry_count'):
            author = str(name.author.user)
            if user == author:
                urls = list(name.images.all().order_by('?'))
                images = []
                friends = []
                for x in urls:
                    images.append(x.url)
                for f in name.users.all():
                    friends.append(f.user.username)
                album_url_list['user_albums'].append({'urls':images,'name':name.name,'author':author,'friends':friends})
            for tagged in name.users.all():
                if user == tagged.user.username:
                    urls2 = list(name.images.all())
                    images2 = []
                    for x in urls2:
                        images2.append(x.url)
                    album_url_list['contr_albums'].append({'urls':images2,'name':name.name,'author':author})
    elif sorting_method == "a-z":
        for name in Album.objects.all().order_by(direction+'name'):
            author = str(name.author.user)
            if user == author:
                urls = list(name.images.all().order_by('?'))
                images = []
                friends = []
                for x in urls:
                    images.append(x.url)
                for f in name.users.all():
                    friends.append(f.user.username)
                album_url_list['user_albums'].append({'urls':images,'name':name.name,'author':author,'friends':friends})
            for tagged in name.users.all():
                if user == tagged.user.username:
                    urls2 = list(name.images.all())
                    images2 = []
                    for x in urls2:
                        images2.append(x.url)
                    album_url_list['contr_albums'].append({'urls':images2,'name':name.name,'author':author})
    elif sorting_method == "date":
        for name in Album.objects.all().order_by(direction+"created_date"):
            author = str(name.author.user)
            if user == author:
                urls = list(name.images.all().order_by('?'))
                images = []
                friends = []
                for x in urls:
                    images.append(x.url)
                for f in name.users.all():
                    friends.append(f.user.username)
                album_url_list['user_albums'].append({'urls':images,'name':name.name,'author':author,'friends':friends})
            for tagged in name.users.all():
                if user == tagged.user.username:
                    urls2 = list(name.images.all())
                    images2 = []
                    for x in urls2:
                        images2.append(x.url)
                    album_url_list['contr_albums'].append({'urls':images2,'name':name.name,'author':author})
    else:
        for name in Album.objects.all().order_by('?'):
            author = str(name.author.user)
            if user == author:
                urls = list(name.images.all().order_by('?'))
                images = []
                friends = []
                for x in urls:
                    images.append(x.url)
                for f in name.users.all():
                    friends.append(f.user.username)
                album_url_list['user_albums'].append({'urls':images,'name':name.name,'author':author,'friends':friends})
            for tagged in name.users.all():
                if user == tagged.user.username:
                    urls2 = list(name.images.all())
                    images2 = []
                    for x in urls2:
                        images2.append(x.url)
                    album_url_list['contr_albums'].append({'urls':images2,'name':name.name,'author':author})
    return (album_url_list)

@csrf_exempt
def delete_album(request):
    if request.is_ajax():
        req = eval(request.body)
        if request.method == 'POST':
            user = UserProfile.objects.get(user__username=request.user)
            album_to_delete = Album.objects.get(author=user,name=req['album'])
            imgs = list(album_to_delete.images.all().order_by('-created_date'))
            # conn = S3Connection(AWS_ACCESS_KEY, AWS_SECRET_KEY)
            # b = Bucket(conn, AWS_BUCKET_NAME)
            # k = Key(b)
            for x in imgs:
                # k.key = x.url[-8:]
                # b.delete_key(k)
                x.delete()
            album_to_delete.delete()
            user = str(request.user)
            album_url_list = fill_albums(user,"a-z","")
            return HttpResponse(
            json.dumps(album_url_list)
            )
