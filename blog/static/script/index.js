
var Radium = require('radium');
var React = require('react')
var ReactDOM = require('react-dom')
var Masonry = require('react-masonry-component');
var masonryOptions = {
    transitionDuration: 1000
};
var img_lst = [];
var album_lst = [];
var albums = [];
var album_selected = null;
var album_author = null;
var temp_count = 0;
var img_count = 0 ;
var load = null;
var profile_image = null;
var user_friends = [];
var friends_options = [];
var friend_requests = [];
var friend_requests_sent = [];
var global_users = [];
var loadimage = new Image();
loadimage.src="http://i.imgur.com/Gljcgpk.gif"
import {StyleRoot} from 'radium';
var Select = require('react-select');

$().ready(function(){
  $('#new_user_profile_picture_url').on('keyup',()=>{
    var $url = $('#new_user_profile_picture_url').val();
    $('#new_user_profile_picture').css("background-size", "cover");
    $('#new_user_profile_picture').css("background-image", "url("+$url+")");
  })
  $('#new_user_get_profile_picture').on('change',(event)=>{
    var current_url = $('#new_user_get_profile_picture').val()
    if(current_url !== "") {
      $('#new_user_profile_picture').css("background-size", "15% 15%");
      $('#new_user_profile_picture').css("background-image", "url(http://i.imgur.com/Gljcgpk.gif)");
    }
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function (event) {
        uploadProfileImage(event.target.result);
    };
    reader.readAsDataURL(file);
  })
  $(document).mousemove( function(e) {
     $('#trash_follow').css({'top':e.pageY+1.5,'main': e.pageX+1.5})
  });



// Set up CSRF TOKEN for Ajax requests
      function getCookie(name)
    {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?

                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    $.ajaxSetup({
         beforeSend: function(xhr, settings) {
             if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                 // Only send the token to relative URLs i.e. locally.
                 xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
             }
         }
    });

});

function Load (selected,author,images,user_albums,contr_albums,album_friends) {
  this.album_selected = selected;
  this.album_author = author;
  this.images = images;
  this.user_albums = user_albums;
  this.contr_albums = contr_albums;
  this.album_friends = album_friends;

  this.updateImages = function(images){
    this.images = images
  },

  this.updateSelected = function(selected,author) {
      this.album_selected = selected;
      this.album_author = author;
  },

  this.listenForDrop = function() {
      if (window.FileReader) {
          var drop;
              drop = document.getElementById('upload_drop_zone');
              function cancel(e) {
                  if (e.preventDefault) {
                      e.preventDefault();
                  }
                  return false;
              }
              try {
                  addEventHandler(drop, 'dragover', cancel);
                  addEventHandler(drop, 'dragenter', cancel);
                  addEventHandler(drop, 'drop',(e) => {
                  e = e || window.event;
                  if (e.preventDefault) {
                      e.preventDefault();
                  }
                  var dt = e.dataTransfer;
                  var files = dt.files;
                  temp_count += files.length;
                  var temp_img_updated = update_temp_img(load.images,files.length);
                  load.images.length = 0;
                  temp_img_updated.map((x) => {
                      load.images.push(x);

                  })

                  for (var i = 0; i < files.length; i++) {
                      var file = files[i];
                      var reader = new FileReader();
                      var mime_type= files[i].type;
                      reader.readAsDataURL(file);
                      addEventHandler(reader, 'loadend', function (e, file) {
                          var bin = this.result;

                          uploadImg(bin,load.album_selected,load.album_author,mime_type);

                      }.bindToEventHandler(file));
                  }
                  remount_left(load.album_selected,load.album_author,temp_img_updated,load.user_albums,load.contr_albums,author,friends_options,load.album_friends);
                  return false;
              })

              Function.prototype.bindToEventHandler = function bindToEventHandler() {
                  var handler = this;
                  var boundParameters = Array.prototype.slice.call(arguments);
                  //create closure
                  return function (e) {
                      e = e || window.event; // get window.event if e argument missing (in IE)
                      boundParameters.unshift(e);
                      handler.apply(this, boundParameters);
                  };
              }
            } catch(x) {
            }
      } else {
          document.getElementById('status').innerHTML = 'Your browser does not support the HTML5 FileReader.';
      }
  }
}

var new_album_friends_selected = [];
var new_album_height;
var New_Album = React.createClass({
    getInitialState: function () {
      return {
        selected_friends:[]
      }

    },
    submitNewAlbum: function () {
        var album_name = document.getElementById('name').value;
        var users = new_album_friends_selected;
        if (album_name !== "") {
            var result = {'album_name':album_name,'users':users, csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value};
            result = JSON.stringify(result);
            $.ajax({
                url: "/new/album",
                method: "POST",
                data: result
            }).done(function (data) {
              var message = JSON.parse(data);
              if (message === "Album Name Exists") {
                alert (message)
              }else {
                window.location.href = "/";
              }
            }).error(function (err) {
                console.log(err);
            });
        }
    },

    friendsChange:function(event){
      new_album_friends_selected = event.split(",");
      var input_height = $('.Select-control').height();
      new_album_height =  320 + (input_height) +'px'
      $('.new_album_form').css('height',new_album_height);
    },

    render: function() {
    return <div className="new_album" >
            <Header friends_options = {this.props.friends_options} current_user = {this.props.current_user} user_albums = {this.props.user_albums} contr_albums = {this.props.contr_albums} />
            <div className="new_album_form">
              <span id="create_album_text">
              Create New Album
              </span>
              <span id="create_album_name_text">
                Name
              </span>
              <input type="text" name="name" className="name" id="name" maxLength="20" />
              <span id="create_album_users_text">
                Users
              </span>
              <div className="friends_select">
              <Select
                  joinValues={true}
                  name="users"
                  options={this.props.friends_options}
                  multi={true}
                  onChange={this.friendsChange}
              />
              </div>
              <button  onMouseDown = {this.submitNewAlbum}>Save</button>
            </div>
          </div>

  }
})

var album_friends_selected = [];
var Edit_Album = React.createClass({
    getInitialState: function () {
      return {
        imgs_selected: [],
        delete_images_verify: false,
        delete_album_verify: false
      }

    },

    selectImgs: function (img) {
      var imgs_selected = this.state.imgs_selected
      if($.inArray(img, imgs_selected) >= 0) {
        var index_number = imgs_selected.indexOf(img)
        imgs_selected.splice(index_number, 1)
      }else {
        imgs_selected.push(img)
      }
      this.setState({
        imgs_selected:imgs_selected
      })
    },

    componentWillMount: function () {
      album_friends_selected = this.props.album_friends
    },
    componentDidMount:function () {
      var input_height = $('.Select-control').height();
      new_album_height =  300 + (input_height) +'px'
        $('.new_album_form').css('height',new_album_height);
        $('#name').val(this.props.album_name);
    },

    saveAlbumChanges: function () {
        var album_name = document.getElementById('name').value;
        var users = album_friends_selected;
        if (album_name === "") {
          album_name = this.props.album_name
        }
            var result = {'album_name':this.props.album_name,'users':users,'new_album_name':album_name, csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value};
            result = JSON.stringify(result);
            $.ajax({
                url: "/edit/album",
                method: "POST",
                data: result
            }).done(function (data) {
              window.location.href = "/";
            }).error(function (err) {
                console.log(err);
            });

    },

    friendsChange:function(event){
      album_friends_selected = event.split(",");
      var input_height = $('.Select-control').height();
      new_album_height =  300 + (input_height) +'px'
      $('.new_album_form').css('height',new_album_height);
    },

    deleteAlbum:function(){
      var result = {'album':this.props.album_name,csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value};
      result = JSON.stringify(result);
      $.ajax({
          url: "/delete/album",
          method: "POST",
          data: result
      }).done(function (data) {
        window.location.href = "/";
      }).error(function (err) {
          console.log(err);
      });
    },

    deleteSelectedImages: function () {
      delete_url(this.state.imgs_selected,this.props.album_name)
    },

    cancelAlbumDelete: function () {
      this.setState({
        delete_album_verify: false
      })
    },

    cancelImagesDelete: function () {
      this.setState({
        delete_images_verify: false
      })
    },

    activateAlbumDelete: function () {
      this.setState({
        delete_album_verify: true
      })
    },

    activateImagesDelete: function () {
      this.setState({
        delete_images_verify: true
      })
    },

    render: function() {
    return <div className="new_album" >
            <Header friends_options = {this.props.friends_options} current_user = {this.props.current_user} user_albums = {this.props.user_albums} contr_albums = {this.props.contr_albums} />
            {
              (this.state.delete_album_verify) && <Delete_Album cancelAlbumDelete = {this.cancelAlbumDelete} deleteAlbum = {this.deleteAlbum} />
            }
            {
              (this.state.delete_images_verify) && <Delete_Images imgs_selected = {this.state.imgs_selected} cancelImagesDelete = {this.cancelImagesDelete} deleteSelectedImages = {this.deleteSelectedImages} />
            }
            <div className="new_album_form">
              <span id="create_album_text">
              Edit Album
              </span>
              <span id="create_album_name_text">
                Name
              </span>
              <input type="text" name="name" className="name" id="name" maxLength="20" />
              <span id="create_album_users_text">
                Share With Friends
              </span>
              <div className="friends_select">
              <Select
                  joinValues={true}
                  name="users"
                  options={this.props.friends_options}
                  multi={true}
                  onChange={this.friendsChange}
                  value={album_friends_selected}
              />
              </div>
              <button className = "save_album_changes" onMouseDown = {this.saveAlbumChanges}>Save</button>
            </div>

            <div className = "delete_album_container">
                <button className = "delete_selected_images" onMouseDown = {this.activateImagesDelete}>Delete Images</button>
                <button className = "delete_album" onMouseDown = {this.activateAlbumDelete}>Delete Album</button>
            </div>

                    <div id="edit_album_title">
                      <span className="album_title">Select Images To Delete</span>
                    </div>
                    <Masonry
                      className={'edit_album_view_images'} // default ''
                      elementType={'div'} // default 'div'
                      options={masonryOptions} // default {}
                      disableImagesLoaded={false} // default false
                    >
                    {
                      this.props.album_images.map((src, i) => {
                        return <View_IMG_Edit imgs_selected = {this.state.imgs_selected} select_source_method = {this.selectImgs} user_albums = {this.props.user_albums} contr_albums = {this.props.contr_albums} album_images = {this.props.album_images} img_source = {src} current_user = {this.props.current_user} album_selected = {this.props.album_name}  key={i} />
                      })
                    }
                    </Masonry>
          </div>

  }
})

var Delete_Album = React.createClass({
    getInitialState: function () {
      return {
        deleteAlbum : this.props.deleteAlbum,
        cancelAlbumDelete: this.props.cancelAlbumDelete,
      }
    },

      render: function () {
        return  <div className = "delete_album_container_full">
                  <div className= "confirm_delete_container">
                    <span className="confirm_album_delete">Are you sure you want to delete this album?</span>
                    <button className = "delete_album_button" onMouseDown = {this.state.deleteAlbum}>Delete Album</button>
                    <button className = "cancel_delete_album_button" onMouseDown = {this.state.cancelAlbumDelete}>Cancel</button>
                  </div>
                </div>
      }

})

var Delete_Images = React.createClass({
    getInitialState: function () {
      return {
        deleteSelectedImages: this.props.deleteSelectedImages,
        cancelImagesDelete: this.props.cancelImagesDelete
      }
    },

      render: function () {
        return  <div className = "delete_album_container_full">
                  <div className= "confirm_delete_container">
                    <span className="confirm_album_delete">Are you sure you want to delete the {this.props.imgs_selected.length} selected image(s)?</span>
                    <button className = "delete_album_button" onMouseDown = {this.state.deleteSelectedImages}>Delete Image(s)</button>
                    <button className = "cancel_delete_album_button" onMouseDown = {this.state.cancelImagesDelete}>Cancel</button>
                  </div>
                </div>
      }

})

var View_IMG_Edit = React.createClass({
    getInitialState: function() {
        return {
            album_images: this.props.album_images,
            current_user: this.props.current_user,
            album_selected: this.props.album_selected,
            imgs_selected: this.props.imgs_selected,
            select_source_method: this.props.select_source_method

        }
    },

    onMouseDownHandler: function() {
      this.state.select_source_method(this.props.img_source)
    },

    render: function() {
      var inarray = $.inArray(this.props.img_source, this.state.imgs_selected)
        if( inarray >= 0) {
          return  <div  onMouseDown={this.onMouseDownHandler} className={'view_image_selected'}>
                  <img src={this.props.img_source} />
                  </div>
        }else {
          return  <div  onMouseDown={this.onMouseDownHandler} className={'view_image'}>
                  <img src={this.props.img_source} />
                  </div>
              }
      }


});

var Friends = React.createClass({
  getInitialState:function() {
    return {
      global_users_state: [],
      requestUpdated: true
    }

  },

  componentDidMount: function () {
    this.searchGlobalUsers();
  },

  searchGlobalUsers: function () {
      this.setState({
        global_users_state: []
      })
      var search = document.getElementById("search_friends_global").value;
      var search_lower = search.toLowerCase();
      var matches =
      global_users.map((x)=>{
        return x
      }).filter((s) => {
          return s.lower_name.indexOf( search_lower ) !== -1;
      })
      setTimeout(() => {
        this.setState({
        global_users_state:matches
      })
    },5)


  },

  requestUpdated: function () {
    this.setState({
      requestUpdated: true
    })
    this.searchGlobalUsers();
  },

  render: function () {
    var username = this.props.current_user+"'s";
    if (friend_requests.length !== 0) {
      return <div>
              <Header friends_options={this.props.friends_options} current_user={this.props.current_user} contr_albums = {this.props.contr_albums}  user_albums = {this.props.user_albums} />
                <div className="friends_main_container">
                  <div className="friend_requests_received_title_container">
                    <span className="friend_requests_received_title">New Friend Requests</span>
                  </div>

                  <Masonry
                      className={'friend_requests_received'} // default ''
                      elementType={'div'} // default 'div'
                      options={masonryOptions} // default {}
                      disableImagesLoaded={false} // default false
                      onImagesLoaded={this.handleImagesLoaded}
                  >
                  {
                    friend_requests.map((x,y) => {
                      var friend = x.name
                      var picture = x.url


                      return <Friend_Request_Received requestUpdated = {this.requestUpdated} number = {y} current_user = {this.props.current_user} user_albums = {this.props.user_albums} contr_albums = {this.props.contr_albums} key={y} profile_picture={picture} user={friend} />
                    })
                  }
                  </Masonry>


                  <div className="user_friends_title_container">
                    <span className="friends_title">{username} Friends</span>
                  </div>

                  <Masonry
                      className={'user_friends'} // default ''
                      elementType={'div'} // default 'div'
                      options={masonryOptions} // default {}
                      disableImagesLoaded={false} // default false
                      onImagesLoaded={this.handleImagesLoaded}
                  >
                  {
                    user_friends.map((x,y) => {
                      var friend = x.name
                      var picture = x.url
                      return <User_Friend key={y} profile_picture={picture} user={friend}  />
                    })
                  }
                  </Masonry>
                  <div className="search_friends_spacer">
                  </div>
                  <div className="search_friends_title_container">
                    <span className="friends_title">Find New Friends</span>
                    <Search_Friends_Global onChangeHandler = {this.searchGlobalUsers} />
                  </div>

                  <Masonry
                      className={'search_friends'} // default ''
                      elementType={'div'} // default 'div'
                      options={masonryOptions} // default {}
                      disableImagesLoaded={false} // default false
                      onImagesLoaded={this.handleImagesLoaded}
                  >
                  {
                    this.state.global_users_state.map((x,y) => {
                      var user = x.name
                      var picture = x.url
                      return <User_Friend_Search_Result key={y} profile_picture={picture} user={user} />
                    })
                  }
                  </Masonry>
                  <div className="friend_spacer">
                  </div>
                </div>
              </div>
    }else {
      return <div>
              <Header friends_options={this.props.friends_options} current_user={this.props.current_user} contr_albums = {this.props.contr_albums}  user_albums = {this.props.user_albums} />
                <div className="friends_main_container">

                  <div className="user_friends_title_container">
                    <span className="friends_title">{username} Friends</span>

                  </div>

                  <Masonry
                      className={'user_friends'} // default ''
                      elementType={'div'} // default 'div'
                      options={masonryOptions} // default {}
                      disableImagesLoaded={false} // default false
                      onImagesLoaded={this.handleImagesLoaded}
                  >
                  {
                    user_friends.map((x,y) => {
                      var friend = x.name
                      var picture = x.url
                      return <User_Friend current_user={this.props.current_user} contr_albums = {this.props.contr_albums}  user_albums = {this.props.user_albums} friends_options={this.props.friends_options} key={y} profile_picture={picture} user={friend}  />
                    })
                  }
                  </Masonry>
                  <div className="search_friends_spacer">
                  </div>
                  <div className="search_friends_title_container">
                    <span className="friends_title">Find New Friends</span>
                    <Search_Friends_Global onChangeHandler = {this.searchGlobalUsers} />
                  </div>

                  <Masonry
                      className={'search_friends'} // default ''
                      elementType={'div'} // default 'div'
                      options={masonryOptions} // default {}
                      disableImagesLoaded={false} // default false
                      onImagesLoaded={this.handleImagesLoaded}
                  >
                  {
                    this.state.global_users_state.map((x,y) => {
                      var user = x.name
                      var picture = x.url
                      return <User_Friend_Search_Result key={y} profile_picture={picture} user={user} />
                    })
                  }
                  </Masonry>
                  <div className="friend_spacer">
                  </div>
                </div>
              </div>
    }
  }
})

var User_Friend = React.createClass({
  render: function () {
      var divStyle = {
        backgroundImage: 'url(' + this.props.profile_picture + ')'
      };
        return  <div className="user_friend_image"  style={divStyle}>
                  <User_Friend_Cover current_user={this.props.current_user} contr_albums = {this.props.contr_albums}  user_albums = {this.props.user_albums} friends_options={this.props.friends_options} user = {this.props.user} profile_picture = {this.props.profile_picture} />
                </div>
  }
})

var User_Friend_Cover = React.createClass({
  onMouseDownHandler: function () {
    this.get_albums();
  },

  get_albums: function () {
      $.ajax({
          url: "/get/friend/albums",
          method: "GET",
          data: {friend:this.props.user}
      }).done((data) => {
          var albums = JSON.parse(data);
          var friends_shared_albums = albums.album_url_list['friends_albums'];
          var user_shared_albums = albums.album_url_list['users_albums'];
          $.ajax({
              url: "/get/messageboard",
              method: "GET",
              data: {friend:this.props.user}
          }).done((data) => {
              var messages = JSON.parse(data);
              ReactDOM.unmountComponentAtNode(document.getElementById('main'));
              ReactDOM.render(React.createElement(Friend_Page,{messages:messages, profile_picture: this.props.profile_picture, user_shared_albums:user_shared_albums, friends_shared_albums:friends_shared_albums, friend_name:this.props.user, friends_options:this.props.friends_options,current_user:this.props.current_user, user_albums:this.props.user_albums,contr_albums:this.props.contr_albums}), document.getElementById('main'));
          }).error(function (err) {
              console.log(err);
          });
      }).error(function (err) {
          console.log(err);
      });
  },

  render: function () {
        return  <div className="user_friend_search_cover" onMouseDown={this.onMouseDownHandler}>
                  <img src={this.props.profile_picture} />
                  <div className="user_friend_search_name"><p>{this.props.user}</p></div>
                </div>
  }
})

var Friend_Message_Board = React.createClass({
  componentDidMount: function () {
    var wtf = $('.message_board_container');
        var height = wtf[0].scrollHeight;
        wtf.scrollTop(height);  },
  render: function () {
    return <div className="message_board_container">
            <div className="message_board">
              {
                this.props.messages.map((x,i)=>{
                  return <Message friend_profile_picture={this.props.friend_profile_picture} owner={x.owner} content={x.content} friend = {this.props.friend_name} current_user = {this.props.current_user} />
                })
              }
            </div>
          </div>
  }
})

var Message_Input = React.createClass({
  getInitialState: function () {
    return {
      updateMessage:this.props.updateMessage
    }
  },
  sendMessage: function () {
    var message = document.getElementById('message_input').value
    message = String(message)
    alert(message)
    var result = {friend:this.props.friend_name,message:message,csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value}
    result = JSON.stringify(result);
    $.ajax({
        url: "/send/message",
        method: "POST",
        data: result
    }).done((data) => {
        var messages = JSON.parse(data);
        this.state.updateMessage(messages)
    }).error(function (err) {
        console.log(err);
    });
  },

  render: function () {
    return <div className="message_input_container">
            <textarea id="message_input" className="message_input">
            </textarea>
            <button className="send_message_button" onMouseDown = {this.sendMessage}>Send</button>
          </div>
  }
})

var Message = React.createClass({

  render: function () {
    if(this.props.owner === this.props.current_user) {
      var profile_picture = {
        backgroundImage: 'url(' + profile_image + ')'
      }
      return <div className="user_message_container">
              <div className="user_message_profile_picture" style={profile_picture}>
              </div>
              <div className="user_message">
                <span className="message_text">{this.props.content}</span>
              </div>
            </div>
    }else {
      var profile_picture = {
        backgroundImage: 'url(' + this.props.friend_profile_picture + ')'
      }
      return <div className="friend_message_container">
              <div className="friend_message_profile_picture" style={profile_picture}>
              </div>
              <div className="friend_message">
                <span className="message_text">{this.props.content}</span>
              </div>
            </div>
    }

  }
})

var Friend_Page = React.createClass({
  getInitialState: function () {
    return {
      friends_shared_albums:this.props.friends_shared_albums,
      user_shared_albums:this.props.user_shared_albums,
      messages:this.props.messages
    }
  },
  updateMessage: function (messages) {
    this.setState({
      messages:messages
    })
  },

  componentWillMount: function () {

  },

  render:function () {
    var friends_name = this.props.friend_name+"'s"
    var friend_photo = {
      backgroundImage:'url(' + this.props.profile_picture + ')'
    }
    return  <div className="friends_main_container">
              <Header friends_options={this.props.friends_options} current_user={this.props.current_user} contr_albums = {this.props.contr_albums}  user_albums = {this.props.user_albums} />
              <div className="friend_page_information">
                <div className="friend_page_photo" style={friend_photo}>
                </div>
                <span className="friend_page_username">{this.props.friend_name}</span>
                <Friend_Message_Board friend_profile_picture = {this.props.profile_picture} messages={this.state.messages} friend_name={this.props.friend_name} current_user={this.props.current_user} />
                <Message_Input friend_name={this.props.friend_name} updateMessage={this.updateMessage}/>
              </div>

              <div id="user_albums_title">
                <span className="album_title">{friends_name} Shared Albums</span>
              </div>
              <Masonry
                  className={'user_albums'} // default ''
                  elementType={'div'} // default 'div'
                  options={masonryOptions} // default {}
                  disableImagesLoaded={false} // default false
                  onImagesLoaded={this.handleImagesLoaded}
              >
              {
                this.state.friends_shared_albums.map((x,y) => {
                  var img_urls = x.urls;
                  var album_friends = x.friends;
                  try {
                  var album_cover = img_urls[0];
                  }catch(x) {
                  return <div></div>
                  }
                  var album_name = x.name;
                  var album_author = x.author;
                  return <Album_IMG album_friends = {album_friends} friends_options={this.props.friends_options} key={y} contr_albums = {this.props.contr_albums}  user_albums = {this.props.user_albums}  current_user = {this.props.current_user}  album_author = {album_author} album_name = {album_name} urls = {img_urls} img_source = {album_cover} />
                })

              }
              </Masonry>
              <div id="friends_albums_title">
                <span className="album_title">Your Shared Albums</span>
              </div>
              <Masonry
              className={'contr_albums'} // default ''
              elementType={'div'} // default 'div'
              options={masonryOptions} // default {}
              disableImagesLoaded={false} // default false
              >
              {
              this.state.user_shared_albums.map((x,y) => {
                var img_urls = x.urls
                try {
                var album_cover = img_urls[0];
                }catch(x) {
                return <div></div>
                }
                var album_name = x.name;
                var album_author = x.author;
                return <Album_IMG friends_options={this.props.friends_options} key={y} contr_albums  = {this.props.contr_albums} user_albums = {this.props.user_albums} current_user = {this.props.current_user} album_author = {album_author} album_name = {album_name} urls = {img_urls} img_source = {album_cover} />
              })
            }
            </Masonry>
            </div>
  }
})


var User_Friend_Search_Result = React.createClass({
  getInitialState:function () {
    return {
      profile_picture:this.props.profile_picture
    }
  },
  render: function () {
      var divStyle = {
        backgroundImage: 'url(' + this.state.profile_picture + ')'
      };
        return  <div className="user_friend_search_image"  style={divStyle}>
                  <User_Friend_Search_Cover user = {this.props.user} profile_picture = {this.state.profile_picture} />
                </div>
  }
})

var User_Friend_Search_Cover = React.createClass({
  getInitialState:function () {
    return {
      request_change:true
    }
  },
  sendFriendRequest:function () {
    var result = {'friend_request':this.props.user,csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value}
    result = JSON.stringify(result);
    $.ajax({
        method: 'POST',
        url: '/friends/requests/send',
        data: result
    }).done((data) => {
      var friend_request_data = JSON.parse(data);
        friend_requests.length = 0;
        friend_requests_sent.length = 0;
        try {
          friend_request_data['received'].map((x)=>{
            friend_requests.push({name:x['name'], url:x['url']})
          })
        }catch(x){
          console.log(x)
        }

        try {
          friend_request_data['sent'].map((x)=>{
            friend_requests_sent.push(x['name'])
          })
        }catch(x) {
          console.log(x)
        }
        this.setState({
          request_change:true
        })
    }).error(function (err) {
        console.log(err);
    });
  },

  cancelFriendRequest: function () {
    var result = {'friend_request':this.props.user,csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value}
    result = JSON.stringify(result);
    $.ajax({
        method: 'POST',
        url: 'delete/friend/request',
        data: result
    }).done((data) => {
      var friend_request_data = JSON.parse(data);
        friend_requests.length = 0;
        friend_requests_sent.length = 0;
        try {
          friend_request_data['received'].map((x)=>{
            friend_requests.push({name:x['name'], url:x['url']})
          })
        }catch(x){
          console.log(x)
        }

        try{
          friend_request_data['sent'].map((x)=>{
            friend_requests_sent.push(x['name'])
          })
        }catch(x){
          console.log(x)
        }

        this.setState({
          request_change:true
        })
    }).error(function (err) {
        console.log(err);
    });
  },

  render: function () {
      if($.inArray(this.props.user, friend_requests_sent) >= 0) {
        return <div className="user_friend_search_cover" onMouseDown={this.cancelFriendRequest}>
        <img src={this.props.profile_picture} />
        <div className="request_sent_check"></div>
        <span>Friend Request Sent</span>
        <div className="user_friend_search_name"><p>{this.props.user}</p></div>
        </div>
      }else {
        return <div className="user_friend_search_cover" onMouseDown={this.sendFriendRequest}>
        <img src={this.props.profile_picture} />
        <div className="user_friend_search_name"><p>{this.props.user}</p></div>
        </div>
      }
  }
})

var Friend_Request_Received = React.createClass({
  getInitialState:function () {
    return {
      profile_picture:this.props.profile_picture
    }
  },
  render: function () {
      var divStyle = {
        backgroundImage: 'url(' + this.state.profile_picture + ')'
      };
        return  <div className="friend_requests_received_image"  style={divStyle}>
                  <Friend_Request_Received_Cover requestUpdated={this.props.requestUpdated} number={this.props.number} current_user = {this.props.current_user} user_albums = {this.props.user_albums} contr_albums = {this.props.contr_albums} user = {this.props.user} profile_picture = {this.state.profile_picture} />
                </div>
  }
})

var Friend_Request_Received_Cover = React.createClass({
  getInitialState: function () {
    return {
      requestUpdated:this.props.requestUpdated,
      mouseOver: false
    }
  },

  mouseOver: function () {
    var className = "div.friend_requests_received_cover." + this.props.number
    $(className).fadeTo(100, .9);

  },

  mouseLeave: function () {
    var className = "div.friend_requests_received_cover." + this.props.number
    $(className).fadeTo(100, 0);
  },

  acceptFriendRequest:function () {
    var result = {'friend_request':this.props.user,csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value}
    result = JSON.stringify(result);
    $.ajax({
        method: 'POST',
        url: 'save/friend',
        data: result
    }).done((data) => {
        var friend_request_data = JSON.parse(data);
        global_users.length = 0
        global_users = friend_request_data['global_users'];
        user_friends = friend_request_data['friends'];
          friend_requests.length = 0;
          friend_requests_sent.length = 0;
          friend_request_data['requests']['received'].map((x)=>{
            friend_requests.push({name:x['name'], url:x['url']})
          })
          friend_request_data['requests']['sent'].map((x)=>{
            friend_requests_sent.push(x['name'])
          })
          this.state.requestUpdated();

    }).error(function (err) {
        console.log(err);
    });
  },

  denyFriendRequest: function () {
    var result = {'friend_request':this.props.user,csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value}
    result = JSON.stringify(result);
    $.ajax({
        method: 'POST',
        url: 'deny/friend/request',
        data: result
    }).done((data) => {
      var friend_request_data = JSON.parse(data);
        global_users.length = 0
        global_users = friend_request_data['global_users'];
        friend_requests.length = 0;
        friend_requests_sent.length = 0;
        try {
          friend_request_data['received'].map((x)=>{
            friend_requests.push({name:x['name'], url:x['url']})
          })
        }catch(x){
          console.log(x)
        }

        try{
          friend_request_data['sent'].map((x)=>{
            friend_requests_sent.push(x['name'])
          })
        }catch(x){
          console.log(x)
        }
        this.state.requestUpdated();
    }).error(function (err) {
        console.log(err);
    });
  },


  render: function () {
    var className = "friend_requests_received_cover " + this.props.number
      return<div onMouseEnter = {this.mouseOver} onMouseLeave = {this.mouseLeave} >
            <div className={className} >
            <img src={this.props.profile_picture} />
            <Accept_Friend_Request acceptFriendRequest = {this.acceptFriendRequest} />
            <Deny_Friend_Request denyFriendRequest = {this.denyFriendRequest} />
            <div className="friend_requests_received_name"><p>{this.props.user}</p></div>
            </div>
            </div>

  }
})


// ReactDOM.unmountComponentAtNode(document.getElementById('main'));
// ReactDOM.render(React.createElement(Friends,{friends_options:user_friends,current_user:this.props.current_user, user_albums:this.props.user_albums,contr_albums:this.props.contr_albums}), document.getElementById('main'));


var Accept_Friend_Request = React.createClass({
  getInitialState: function () {
    return {
      acceptFriendRequest: this.props.acceptFriendRequest
    }
    },
  render: function () {
    return <div className="friend_request_accept" onMouseDown={this.state.acceptFriendRequest}>
          </div>
  }

})

var Deny_Friend_Request = React.createClass({
  getInitialState: function () {
    return {
      denyFriendRequest: this.props.denyFriendRequest
    }
    },
  render: function () {
    return  <div className="friend_request_deny" onMouseDown={this.state.denyFriendRequest}>
            </div>
  }

})

var Header = React.createClass({
  getInitialState: function() {
    return {
      backAlbums:this.props.backAlbums,
      user_albums:this.props.user_albums,
      contr_albums:this.props.contr_albums,
      current_user:this.props.current_user,
      friends_options:this.props.friends_options
    }
  },

  backAlbums: function () {
    album_lst.length = 0;
    img_lst.length = 0;
    ReactDOM.unmountComponentAtNode(document.getElementById('main'));
    ReactDOM.render(React.createElement(Album_Container,{current_user:this.state.current_user, user_albums:this.props.user_albums, contr_albums:this.props.contr_albums}), document.getElementById('main'));
  },

  createAlbum: function () {
    ReactDOM.unmountComponentAtNode(document.getElementById('main'));
    ReactDOM.render(React.createElement(New_Album,{friends_options:this.props.friends_options,current_user:this.state.current_user, user_albums:this.state.user_albums,contr_albums:this.state.contr_albums}), document.getElementById('main'));
  },

  viewFriends: function () {
    ReactDOM.unmountComponentAtNode(document.getElementById('main'));
    ReactDOM.render(React.createElement(Friends,{friends_options:this.props.friends_options,current_user:this.state.current_user, user_albums:this.state.user_albums,contr_albums:this.state.contr_albums}), document.getElementById('main'));
  },

  render: function() {
    if (this.props.authenticated) {
      return <div className="page-header" id="page-header" >
      <div className="top-menu">

        <div onMouseDown={this.backAlbums} id="back_albums">
          <span>
            Albums
          </span>
        </div>

        <div onMouseDown={this.createAlbum} id="create_new_album">
          <span>
            New Album
        </span>
        </div>


        <label className="switch">
          <input id="imgur_check" type="checkbox" checked="True"/>
          <div className="slider round"></div>
        </label>
        <span id="hello_user">Hello {this.props.user_name}(<a href='/accounts/logout/'>Log out</a>)</span>
      </div>
      </div>
    }else {
      return <div className="page-header" id="page-header" >
      <div id="logo">
      </div>
      <div className="top-menu">
        <div onMouseDown={this.viewFriends} id="friends">
          <p>
            Friends
          </p>
        </div>

        <div onMouseDown={this.backAlbums} id="back_albums">
          <p>
            Albums
          </p>
        </div>

        <div onMouseDown={this.createAlbum} id="create_new_album">
          <p>
            New Album
        </p>
        </div>


        <User_Commands user_name={this.props.current_user}/>

        <label className="switch">
          <input id="imgur_check" type="checkbox" checked="True" />
          <div className="slider round"></div>
        </label>

      </div>
    </div>
    }


  }
})

var User_Commands = React.createClass({
  getInitialState: function () {
    return {
          selected:false,
          logout_style: {cursor: "pointer", background: "#000000"},
          main_style: {}
    }
  },

  mainOver: function () {
      this.setState({
        selected:true,
        main_style:{cursor: "pointer", background: "#5B97EF"}
      })


  },

  mainLeave:function () {
    this.setState({
      selected:false,
      main_style:{},
      logout_style:{background:"#000000"}
    })
  },



  logout:function () {
    window.location.href = "/accounts/logout";
  },

  logoutOver:function () {
    this.setState({
      logout_style: {cursor: "pointer", background: "#5B97EF"}
    })
  },

  logoutLeave:function () {
    this.setState({
      logout_style:{background: "#000000"}
    })
  },

  render: function () {
    return <div style = {this.state.main_style} id="user_commands" onMouseEnter = {this.mainOver} onMouseLeave = {this.mainLeave}>
              <p>{this.props.user_name} ▾
              </p>
              {
                this.state.selected && <div id="user_commands_container">
                                          <div style = {this.state.logout_style} id="user_commands_logout" onMouseLeave = {this.logoutLeave} onMouseOver = {this.logoutOver} onMouseDown = {this.logout}>
                                            <p> Logout </p>
                                          </div>
                                        </div>
              }
            </div>
  }
})

var Upload_Imgs = React.createClass({
  getInitialState:function(){
    return {
      closeUpload: this.props.closeUpload
    }
  },
  render: function() {
    return <div className="upload_main">
            <div onMouseDown = {this.state.closeUpload} className="close_upload">
            X
            </div>
            <div onMouseDown = {this.state.closeUpload} className="upload_drop_zone" id="upload_drop_zone">
              <p>Drag and Drop</p>
            </div>
            <File_Input updateLoad={this.props.updateLoad} album={this.props.current_album} author={this.props.author}/>
            </div>
  }
})

var loading = true;

var Album_Container = React.createClass({
  updateSelectedImg: function(source,author) {
    this.setState({
      album_selected: source
    })
  },

  updateAlbumOrder: function(user_albums,contr_albums) {
    this.setState({
      user_album_holder: user_albums,
      contr_album_holder: contr_albums,
      user_albums: user_albums,
      contr_albums: contr_albums
    })
  },

  updateLoad: function(loading_status) {
    this.setState({
      loading:loading_status
    })
  },

  getInitialState: function() {
      return {
          user_album_holder: this.props.user_albums,
          contr_album_holder: this.props.contr_albums,
          friends_options: null,
          delete_album: false,
          user_albums:this.props.user_albums,
          contr_albums:this.props.contr_albums,
          album_selected: null,
          current_user: this.props.current_user,
          user_name: this.props.current_user+"'s",
          key_code: null,
          class_name: null,
          loading: false
      }
  },

  keyDown: function(event){

    try{
      switch(event.keyCode) {
        case 16:
          this.setState({
            key_code:event.keyCode
          })
          break;
        case 27:
        document.getElementById("trash_follow").style.visibility ='hidden';
        document.body.style.cursor = "default";
        document.getElementById("trash").style.visibility ='visible';


          this.setState({
            delete_album: false
          })
          break;
      }
    }catch(x) {}

  },

  onChangeHandler:function (){
    this.setState({
      user_albums: [],
      contr_albums: [],
    })
    var search = document.getElementById("search_album").value;
    var matches =
      this.state.user_album_holder.filter((s) => {
        return s.name.indexOf( search ) !== -1;
      })
      var matches2 =
        this.state.contr_album_holder.filter((s) => {
          return s.name.indexOf( search ) !== -1;
        })

        setTimeout(() => {
          this.setState({
          user_albums: matches,
          contr_albums: matches2,
        })
      },5)
  },

  keyUp:function(event){
    if(this.state.key_code === 16) {
      try {
        this.setState({
          key_code: null
        });
      } catch (x) {}
    }
  },

  deleteAlbum: function() {
    if (this.state.album_selected === null) {
      document.getElementById("trash").style.visibility ='collapse';
      document.getElementById("trash_follow").style.visibility ='visible';
      document.body.style.cursor = "none";
      this.setState({
        delete_album: true
      })
    }else {
      delete_album(this.state.album_selected)
    }
  },

  componentDidMount: function() {
    window.addEventListener("keydown", this.keyDown, false);
    window.addEventListener("keyup", this.keyUp, false);

    // document.getElementById('trash').addEventListener('click', this.deleteAlbum, false);

  },

  componentWillMount: function() {
    this.getFriendRequests();
      getFriends((friends) => {
      this.setState({
        friends_options:friends
      })
    });

  },

  getFriendRequests:function () {
    $.ajax({
        url: "get/friends/requests",
        method: "GET",
        data: {}
    }).done((data) => {
        var friend_request_data = JSON.parse(data);
          friend_requests.length = 0;
          friend_requests_sent.length = 0;
          friend_request_data['received'].map((x)=>{
            friend_requests.push({name:x['name'], url:x['url']})
          })
          friend_request_data['sent'].map((x)=>{
            friend_requests_sent.push(x['name'])
          })
    }).error(function (err) {
        console.log(err);
    })
  },



  change:function() {

  },


  render: function() {
    window.scrollTo(0, 0);
    var friends_albums = "Friends' Albums";
    if(this.state.user_albums.length !== 0) {
      if(loading) {
        loading = false;
        this.setState({
          loading: true
        })

      }
    }
    if (this.state.loading) {
      return <div>
              <Loading_Cover/>

              <h1>Your Albums</h1>
              <Masonry
                  className={'user_albums'} // default ''
                  elementType={'div'} // default 'div'
                  options={masonryOptions} // default {}
                  disableImagesLoaded={false} // default false
                  onImagesLoaded={this.handleImagesLoaded}
              >
              {
                this.state.user_albums.map((x,y) => {
                  var img_urls = x.urls
                  var album_cover = img_urls[0];
                  var album_name = x.name;
                  var album_author = x.author;
                  var last_album = null;
                  if(this.state.contr_albums.length === 0) {
                    if(this.state.contr_albums.indexOf(x) === this.state.contr_albums.length-1) {
                      last_album = true;
                    }
                  }
                  return <Album_IMG friends_options={this.state.friends_options} updateLoad = {this.updateLoad} last_album = {last_album} key={y} contr_albums = {this.state.contr_albums} user_albums = {this.state.user_albums}  delete_album={this.delete_album} select_source_method={this.select_source_method} current_user = {this.props.current_user} key_code = {this.state.key_code}  album_author = {album_author} album_name = {album_name} class_name = {"col-sm album_img selected"} urls = {img_urls} img_source = {album_cover} />
                })

              }
              </Masonry>
              <h1>Tagged Albums</h1>
              <Masonry
              className={'contr_albums'} // default ''
              elementType={'div'} // default 'div'
              options={masonryOptions} // default {}
              disableImagesLoaded={false} // default false
              >
              {
              this.state.contr_albums.map((x,y) => {
                var last_album = null;
                if(this.state.contr_albums.indexOf(x) === this.state.contr_albums.length-1) {
                  last_album = true;
                }
                var img_urls = x.urls
                var album_cover = img_urls[0];
                var album_name = x.name;
                var album_author = x.author;
                return <Album_IMG friends_options={this.state.friends_options} key={y} contr_albums = {this.state.contr_albums} updateLoad = {this.updateLoad} last_album = {last_album} user_albums = {this.state.user_albums}  delete_album={this.delete_album} select_source_method={this.select_source_method} current_user = {this.props.current_user} key_code = {this.state.key_code}  album_author = {album_author} album_name = {album_name} class_name = {"col-sm album_img selected"} urls = {img_urls} img_source = {album_cover} />
              })
            }
            </Masonry>
            </div>
    }else {
      return <div id="album_holder">
              <Header friends_options={this.state.friends_options} current_user={this.state.current_user} contr_albums = {this.state.contr_albums}  user_albums = {this.state.user_albums} />
              <Sort_User_Albums_Container updateAlbumOrder = {this.updateAlbumOrder} />
              <div id="user_albums_title">
                <Search_Albums onChangeHandler = {this.onChangeHandler} />
                <span className="album_title">{this.state.user_name} Albums</span>
              </div>
              <Masonry
                  className={'user_albums'} // default ''
                  elementType={'div'} // default 'div'
                  options={masonryOptions} // default {}
                  disableImagesLoaded={false} // default false
                  onImagesLoaded={this.handleImagesLoaded}
              >
              {
                this.state.user_albums.map((x,y) => {
                  var img_urls = x.urls;
                  var album_friends = x.friends;
                  try {
                  var album_cover = img_urls[0];
                  }catch(x) {
                  return <div></div>
                  }
                  var album_name = x.name;
                  var album_author = x.author;
                  return <Album_IMG album_friends = {album_friends} friends_options={this.state.friends_options} key={y} contr_albums = {this.state.contr_albums}  user_albums = {this.state.user_albums}  delete_album={this.delete_album} select_source_method={this.select_source_method} current_user = {this.props.current_user} key_code = {this.state.key_code}  album_author = {album_author} album_name = {album_name} class_name = {"col-sm album_img selected"} urls = {img_urls} img_source = {album_cover} />
                })

              }
              </Masonry>
              <div id="friends_albums_title">
                <span className="album_title">{friends_albums}</span>
              </div>
              <Masonry
              className={'contr_albums'} // default ''
              elementType={'div'} // default 'div'
              options={masonryOptions} // default {}
              disableImagesLoaded={false} // default false
              >
              {
              this.state.contr_albums.map((x,y) => {
                var last_album = null;
                if(this.state.contr_albums.indexOf(x) === this.state.contr_albums.length-1) {
                  last_album = true;
                }
                var img_urls = x.urls
                try {
                var album_cover = img_urls[0];
                }catch(x) {
                return <div></div>
                }
                var album_name = x.name;
                var album_author = x.author;
                return <Album_IMG friends_options={this.state.friends_options} key={y} contr_albums  = {this.state.contr_albums} updateLoad = {this.updateLoad} last_album = {last_album} user_albums = {this.state.user_albums}  delete_album={this.delete_album} select_source_method={this.select_source_method} current_user = {this.props.current_user} key_code = {this.state.key_code}  album_author = {album_author} album_name = {album_name} class_name = {"col-sm album_img selected"} urls = {img_urls} img_source = {album_cover} />
              })
            }
            </Masonry>


            </div>
    }


  }
});


var Album_IMG = React.createClass({
  getInitialState: function () {
    return {
    updateLoad: this.props.updateLoad
  }
  },

  updateLoad: function () {
    this.state.updateLoad(false)
  },
  onMouseEnterHandler: function() {

  },
  onMouseLeaveHandler: function() {

  },


  render: function() {
    var divStyle = {
        backgroundImage: 'url(' + this.props.img_source + ')'
    };

      if(this.props.last_album) {
        return  <div className="album_image" onLoad = {this.updateLoad} style={divStyle}>
          <Album_Cover album_friends = {this.props.album_friends} friends_options={this.props.friends_options} contr_albums = {this.props.contr_albums} user_albums = {this.props.user_albums}  delete_album={this.props.delete_album} select_source_method={this.props.select_source_method} current_user = {this.props.current_user} album_author = {this.props.album_author} album_name = {this.props.album_name} urls = {this.props.urls} img_source = {this.props.img_source} />

          </div>
      }else{
        return  <div className="album_image"  style={divStyle}>
          <Album_Cover album_friends = {this.props.album_friends} friends_options={this.props.friends_options} contr_albums = {this.props.contr_albums} user_albums = {this.props.user_albums}  delete_album={this.props.delete_album} select_source_method={this.props.select_source_method} current_user = {this.props.current_user} album_author = {this.props.album_author} album_name = {this.props.album_name} urls = {this.props.urls} img_source = {this.props.img_source} />

          </div>
      }

  }
});

var Loading_Cover = React.createClass({


  componentWillUnmount:function() {
    var elem = ReactDOM.findDOMNode(this)
    // Set the opacity of the element to 0
    elem.style.opacity = 1;
    window.requestAnimationFrame(function() {
        // Now set a transition on the opacity
        elem.style.transition = "opacity 2000ms";
        // and set the opacity to 1
        elem.style.opacity = 0;
    });
  },
  render: function() {
return      <div id="loading"></div>

  }
})




var Album_Cover = React.createClass({
  getInitialState: function() {
    return {
      delete_album: this.props.delete_album,
      album_author: this.props.album_author,
      album_name: this.props.album_name,
      img_source: this.props.img_source,
      urls: this.props.urls,
      select_source_method: this.props.select_source_method,
      key_code: this.props.key_code,
      current_user: this.props.current_user
    }
  },

  onMouseDownHandler: function() {
    $("#loading").fadeIn("fast")
        album_selected = this.state.album_name;
        album_author = this.state.album_author;
        remount_left(this.props.album_name,this.props.album_author,this.props.urls,this.props.user_albums,this.props.contr_albums,this.props.current_user,this.props.friends_options,this.props.album_friends);
  },

  render: function() {
    var circle_urls = [];
    var url_length = this.props.urls.length;
    var album_cover = this.props.urls[Math.floor( Math.random() * (url_length - 0) + 0 )];
    for (var x = 0; x < 3; x++) {
      var random_number = Math.floor( Math.random() * (url_length - 0) + 0 );
      circle_urls.push(this.props.urls[random_number])
    }
    var circle_back1 = {
        backgroundImage:'url(' + circle_urls[0] + ')'
    }
    var circle_back2 = {
        backgroundImage:'url(' + circle_urls[1] + ')'
    }
    var circle_back3 = {
        backgroundImage:'url(' + circle_urls[2] + ')'
    }

    return <div className="what" onMouseDown={this.onMouseDownHandler}>
            <img src={album_cover} />
            <div style={circle_back1} className="circle1"></div>
            <div style={circle_back2} className="circle2"></div>
            <div style={circle_back3} className="circle3"></div>
            <div className="title_cont"><p>{this.props.album_name}</p></div>
          </div>
  }
})

var Search_Albums = React.createClass({
  getInitialState: function () {
    return {
      onChangeHandler : this.props.onChangeHandler,
      placeholder : "",
    }
  },

  onFocusHandler: function () {
    this.setState({
      placeholder: "Search"
    })
  },

  onBlurHandler: function () {
    this.setState({
      placeholder: ""
    })
  },

  render: function () {
    return <input placeholder = {this.state.placeholder} id="search_album" onBlur = {this.onBlurHandler} onChange = {this.state.onChangeHandler} onFocus = {this.onFocusHandler} />
  }
})

var Search_Friends_Global = React.createClass({
  getInitialState: function () {
    return {
      onChangeHandler : this.props.onChangeHandler,
      placeholder : "",
    }
  },

  onFocusHandler: function () {
    this.setState({
      placeholder: "Search"
    })
    $('html, body').animate({
        scrollTop: $(".search_friends_spacer").offset().top
    }, 500);
  },

  onBlurHandler: function () {
    this.setState({
      placeholder: ""
    })
  },

  render: function () {
    return <input placeholder = {this.state.placeholder} id="search_friends_global" onBlur = {this.onBlurHandler} onChange = {this.state.onChangeHandler} onFocus = {this.onFocusHandler} />
  }
})



var User_Album_Settings = React.createClass({
  getInitialState: function () {
    return {
      album_settings_visible: false
    }

  },
  onMouseDownHandler: function() {
    if(this.state.album_settings_visible) {
      this.setState({
        album_settings_visible: false
      })
    }else {
      this.setState({
        album_settings_visible: true
      })
    }

  },
  render: function() {
    return <div id="user_albums_settings_container">
             <div onMouseDown = {this.onMouseDownHandler} id="user_albums_settings">
             </div>

           </div>
  }

})


var Sort_User_Albums_Container = React.createClass({
  render: function () {

      return <div id="sort_user_albums_container">
              <div id="sort_user_albums">
                <span>Sort Albums </span>
              </div>
              <Sort_User_Albums_A_Z updateAlbumOrder = {this.props.updateAlbumOrder} />
              <Sort_User_Albums_Date_Created updateAlbumOrder = {this.props.updateAlbumOrder} />
              <Sort_User_Albums_Image_Count updateAlbumOrder = {this.props.updateAlbumOrder} />
            </div>
  }
})

var Sort_User_Albums_A_Z = React.createClass({
  getInitialState: function () {
    return {
      background:"#3498DB",
      cursor:"default",
      borderBottom: "5px solid #2980B9",
      updateAlbumOrder: this.props.updateAlbumOrder,
      direction: ""
    }

  },

  onMouseOverHandler:function () {
      this.setState({
        cursor:"pointer"
      })
  },

  onMouseLeaveHandler:function () {
      this.setState({
        cursor:"default"
      })
  },

  onMouseDownHandler: function() {
    this.updateOrder()
    if(this.state.direction === "") {
      this.setState({
        borderBottom: "3px solid #2980B9",
        direction: "-"
      })
    }else {
      this.setState({
        borderBottom: "3px solid #2980B9",
        direction: ""
      })
    }
  },

  onMouseUpHandler: function () {
    this.setState({
      borderBottom: "5px solid #2980B9"
    })
  },

  updateOrder: function () {
    $.ajax({
        url: "/get/",
        method: "GET",
        data: {sorting_method:"a-z",
               direction: this.state.direction
              }
    }).done((data) => {
        albums = JSON.parse(data);
        var user_albums = albums.album_url_list['user_albums'];
        var contr_albums = albums.album_url_list['contr_albums'];
        this.state.updateAlbumOrder(user_albums,contr_albums);
    }).error(function (err) {
        console.log(err);
    });
  },


  render: function () {
    var divStyle = {
      background:this.state.background,
      borderBottom:this.state.borderBottom,
      cursor:this.state.cursor
    }
    return <div onMouseUp = {this.onMouseUpHandler} onMouseDown = {this.onMouseDownHandler} onMouseLeave = {this.onMouseLeaveHandler} onMouseOver = {this.onMouseOverHandler} className = "animate action_button" id="sort_user_albums_A_Z" style={divStyle}>
            <span>A - Z </span>
           </div>
  }
})

var Sort_User_Albums_Date_Created = React.createClass({
  getInitialState: function () {
    return {
      background:"#3498DB",
      borderBottom: "5px solid #2980B9",
      updateAlbumOrder: this.props.updateAlbumOrder,
      direction: "",
      cursor:"default"
    }

  },

  onMouseOverHandler:function () {
      this.setState({
        cursor: "pointer"
      })
  },

  onMouseLeaveHandler:function () {
      this.setState({
        cursor: "default"
      })
  },

  onMouseDownHandler: function() {
    this.updateOrder()
    if(this.state.direction === "") {
      this.setState({
        borderBottom: "3px solid #2980B9",
        direction: "-"
      })
    }else {
      this.setState({
        borderBottom: "3px solid #2980B9",
        direction: ""
      })
    }
  },

  onMouseUpHandler: function () {
    this.setState({
      borderBottom: "5px solid #2980B9"
    })
  },

  updateOrder: function () {
    $.ajax({
        url: "/get/",
        method: "GET",
        data: {sorting_method:"date",
               direction: this.state.direction
              }
    }).done((data) => {
        albums = JSON.parse(data);
        var user_albums = albums.album_url_list['user_albums'];
        var contr_albums = albums.album_url_list['contr_albums'];
        this.state.updateAlbumOrder(user_albums,contr_albums);
    }).error(function (err) {
        console.log(err);
    });
  },


  render: function () {
    var divStyle = {
      background:this.state.background,
      borderBottom:this.state.borderBottom,
      cursor:this.state.cursor
    }
    return <div onMouseUp = {this.onMouseUpHandler} onMouseDown = {this.onMouseDownHandler} onMouseLeave = {this.onMouseLeaveHandler} onMouseOver = {this.onMouseOverHandler} className = "animate action_button" id="sort_user_albums_date_created" style={divStyle}>
            <span>Date Created</span>
           </div>
  }
})

var Sort_User_Albums_Image_Count = React.createClass({
  getInitialState: function () {
    return {
      background:"#3498DB",
      borderBottom: "5px solid #2980B9",
      updateAlbumOrder: this.props.updateAlbumOrder,
      direction: "-",
      cursor: "default"
    }
  },

  onMouseOverHandler:function () {
      this.setState({
        cursor:"pointer"
      })
  },

  onMouseLeaveHandler:function () {
      this.setState({
        cursor:"default"
      })
  },

  onMouseDownHandler: function() {
    this.updateOrder()
    if(this.state.direction === "") {
      this.setState({
        borderBottom: "3px solid #2980B9",
        direction: "-"
      })
    }else {
      this.setState({
        borderBottom: "3px solid #2980B9",
        direction: ""
      })
    }
  },

  onMouseUpHandler: function () {
    this.setState({
      borderBottom: "5px solid #2980B9"
    })
  },

  updateOrder: function () {
    $.ajax({
        url: "/get/",
        method: "GET",
        data: {sorting_method:"image_count",
               direction: this.state.direction
              }
    }).done((data) => {
        albums = JSON.parse(data);
        var user_albums = albums.album_url_list['user_albums'];
        var contr_albums = albums.album_url_list['contr_albums'];
        this.state.updateAlbumOrder(user_albums,contr_albums);
    }).error(function (err) {
        console.log(err);
    });
  },


  render: function () {
    var divStyle = {
      background:this.state.background,
      borderBottom:this.state.borderBottom,
      cursor:this.state.cursor
    }
    return <div onMouseUp = {this.onMouseUpHandler} onMouseDown = {this.onMouseDownHandler} onMouseLeave = {this.onMouseLeaveHandler} onMouseOver = {this.onMouseOverHandler} className = "animate action_button" id="sort_user_albums_image_count" style={divStyle}>
            <span>Image Count</span>
           </div>
  }
})


var Min_Container = React.createClass({
  updateSelectedImg: function(source) {
      this.setState({ select_source: source,
                      main_img: source[source.length-1]
                    });
  },

  updateMainImg: function(img) {
    this.setState({
      main_img: img
    })
  },

  getInitialState: function() {
      return {
          main_img: this.props.images[0],
          user_albums: this.props.user_albums,
          contr_albums: this.props.contr_albums,
          images: this.props.images,
          select_source: [this.props.images[0]],
          album_selected: this.props.album_selected,
          album_author: this.props.album_author,
          current_user: this.props.current_user,
          album_friends: this.props.album_friends,
          key_code: null,
          loading: true,
          upload:false

      }
  },
  updateLoad: function(loading_status) {
    this.setState({
      loading:loading_status
    })
    load = null;
  },

  backAlbums: function () {
    album_lst.length = 0;
    img_lst.length = 0;
    load.forgetDrop()
    load = null;
    ReactDOM.unmountComponentAtNode(document.getElementById('main'));
    ReactDOM.render(React.createElement(Album_Container,{user_albums:this.props.user_albums,contr_albums:this.props.contr_albums}), document.getElementById('main'));
  },

  nextImg: function () {
    var current_index = album_lst.indexOf(this.state.main_img);
    var new_img = "";
    if (current_index !== album_lst.length - 1) {
      new_img = album_lst[current_index+1]
    } else {
      new_img = album_lst[0]
    }
    this.updateMainImg(new_img);
  },

  previousImg: function () {
    var current_index = album_lst.indexOf(this.state.main_img);
    var new_img = "";
    if (current_index > 0) {
      new_img = album_lst[current_index-1]
    } else if (current_index === 0 && album_lst.length === 1) {
    } else {
      new_img = album_lst[album_lst.length - 1]
    }
    this.updateMainImg(new_img);
  },

  uploadImg:function () {
    this.setState({
      upload:true
    })

    setTimeout(()=>{
      if (load === null) {
        load = new Load(this.props.album_selected,this.props.album_author,this.props.images,this.props.user_albums,this.props.contr_albums,this.props.album_friends)
        load.listenForDrop();
      }else {
        load.updateImages(this.state.urls)
        load.updateSelected(this.props.album_selected,this.props.album_author)
      }
    },200)
  },

  closeUpload:function() {
    this.setState({
      upload:false
    })
    load = null;
  },

  editAlbumSettings:function() {
    ReactDOM.unmountComponentAtNode(document.getElementById('main'));
    ReactDOM.render(React.createElement(Edit_Album,{album_name:this.state.album_selected,friends_options:this.props.friends_options,current_user:this.state.current_user, user_albums:this.state.user_albums,contr_albums:this.state.contr_albums,album_friends:this.props.album_friends,album_images:this.state.images}), document.getElementById('main'));
  },
  render: function() {
      if(this.props.images.length === 0) {
        this.setState({
          loading:false
        })
      }
      var last_image = false
      return <div id="album_holder">
              {
                (this.state.upload) && <Upload_Imgs updateLoad = {this.updateLoad} current_album = {this.state.album_selected} author={this.state.current_user} closeUpload = {this.closeUpload} />
              }
              {
                (this.state.loading) && <Loading_Cover />
              }
              <Header friends_options={this.props.friends_options} current_user={this.state.current_user} contr_albums = {this.state.contr_albums}  user_albums = {this.state.user_albums} />
              <div id="album_title">
                <div onMouseDown = {this.uploadImg} id="upload_image" >
                </div>
                <div onMouseDown = {this.editAlbumSettings} id="album_settings">
                </div>
                <span className="album_title">{this.props.album_selected}</span>
              </div>
              <Masonry
                className={'view_images'} // default ''
                elementType={'div'} // default 'div'
                options={masonryOptions} // default {}
                disableImagesLoaded={false} // default false
              >
              {
                this.props.images.map((src, i) => {
                  if(this.props.images.indexOf(src) === this.props.images.length - 1){
                    last_image = true;
                  }
                  return <View_IMG friends_options={this.props.friends_options} user_albums = {this.state.user_albums} contr_albums = {this.state.contr_albums} album_images = {this.state.images} last_image = {last_image} updateLoad = {this.updateLoad} img_source = {src} key_code = {this.state.key_code} current_user = {this.state.current_user} album_author = {this.props.album_author} album_selected = {this.props.album_selected} select_source={this.state.select_source} select_source_method={this.updateSelectedImg} key={i} />
                })
              }
              </Masonry>
            </div>



  },

  getUserInfo: function() {
    $.ajax({
        url: "/get/user",
        method: "GET",
        data: {}
    }).done((data) => {
        var user_info = JSON.parse(data);
        profile_image = user_info['profile_picture']
        this.setState({
          current_user: user_info['user_name']
        })
    }).error(function (err) {
        console.log(err);
    });
  },

  deleteImgs: function() {
          delete_url(img_lst,this.state.album_selected)
  },

  componentDidMount: function() {
    window.addEventListener("keydown", this.keyDown, false);
    window.addEventListener("keyup", this.keyUp, false);
    // document.getElementById('trash').addEventListener('click', this.deleteImgs, false);
    // document.getElementById('back_albums').addEventListener('click', this.backAlbums, false);
    // ReactDOM.render(React.createElement(Rotate_IMG, { img_source: album_lst[0] }), document.getElementById('right'));

  },
  componentWillUnmount: function() {
    // document.getElementById('trash').removeEventListener('click', this.deleteImgs, false);
    // document.getElementById('back_albums').removeEventListener('click', this.backAlbums, false);
  },
  componentWillMount: function() {
    this.getUserInfo();
  }
});

var View_IMG = React.createClass({
    getInitialState: function() {
        return {
            album_images: this.props.album_images,
            updateLoad: this.props.updateLoad,
            current_user: this.props.current_user,
            album_selected: this.props.album_selected,
            album_author: this.props.album_author,
            hidden: 'hidden',
            select_source_method: this.props.select_source_method,
            img_source: this.props.img_source,
            img_number: this.props.img_number,
            class_name: this.props.class_name,
            key_code: this.props.key_code
        }
    },

    updateLoad:function() {
      setTimeout(() =>{
        this.state.updateLoad(false);
    },400)

  },


    deleteImg: function() {
      var lst = [];
      lst.push(this.state.img_source)
        delete_url(lst,this.state.album_selected);
    },

    onMouseDownHandler: function() {
      ReactDOM.unmountComponentAtNode(document.getElementById('main'));
      ReactDOM.render(React.createElement(Slideshow, {friends_options: this.props.friends_options, current_user: this.state.current_user, user_albums: this.props.user_albums, contr_albums: this.props.contr_albums, album_images: this.state.album_images, img_source:this.state.img_source }), document.getElementById('main'));

    },

    render: function() {
      if (this.props.last_image) {
        return  <div onMouseDown={this.onMouseDownHandler} className={'view_image'}>
                <img onLoad={this.updateLoad} src={this.props.img_source} />
                </div>
      }else {
        return  <div  onMouseDown={this.onMouseDownHandler} className={'view_image'}>
                <img src={this.props.img_source} />
                </div>
      }

    }
});
var keyframesMidToLeft = Radium.keyframes({
  '0%': {left: 0},
  '100%': {left: '-200em'},
});

var keyframesMidToRight = Radium.keyframes({
  '0%': {left: 0},

  '100%':{left: '200em'},
});

var keyframesRightToMid = Radium.keyframes({
  '0%': {left: '100em'},
  '100%': {left: 0},
});

var keyframesLeftToMid = Radium.keyframes({
  '0%': {left: '-150em'},
  '100%': {left: 0},
});

var styles = {
  mid_left: {
  animation: 'x .2s linear 0s ',
  animationName: keyframesMidToLeft,
  left: "-200em"
  },

  mid_right: {
  animation: 'x .2s linear 0s ',
  animationName: keyframesMidToRight,
  left:"200em"
  },

  right_mid: {
  animation: 'x .2s linear 0s ',
  animationName: keyframesRightToMid,
  left: 0
  },

  left_mid:{
  animation: 'x .2s linear 0s ',
  animationName: keyframesLeftToMid,
  left: 0
  },

  center: {
  left:0
  },

  right: {
  left:'150em',
  },

  left: {
  left:'-150em',
  }

}
var center = true;

var Slideshow = React.createClass({
    getInitialState: function() {
        return {
            img_source: this.props.img_source,
            previousImg: this.props.previousImg,
            next_img: this.props.nextImg,
            center_style: styles.center,
            next_img_style: styles.right,
            selected_img: this.props.img_source
        }
    },

    updateSelectedImg: function (new_img) {
      if(center){
        this.setState({

          next_img: new_img,
          selected_img: new_img,
          next_img_style:styles.right_mid,
          center_style:styles.mid_left

        })
        center = false;
      }else {
        this.setState({
          img_source: new_img,
          selected_img: new_img,
          center_style:styles.right_mid,
          next_img_style:styles.mid_left,

        })
        center = true;
      }
    },

    componentWillMount: function () {


    },

    nextImg: function() {
      if(center){
        var current_index = this.props.album_images.indexOf(this.state.img_source);
        var new_img;
        if (current_index !== this.props.album_images.length - 1) {
          new_img = this.props.album_images[current_index+1];
        } else {

          new_img = this.props.album_images[0];
          var myImage = new Image();
          myImage.src = new_img;
        }

          this.setState({
            next_img: new_img,
            next_img_style:styles.right_mid,
            center_style:styles.mid_left,
            selected_img: new_img
          })


        center = false;
      }else {
        var current_index = this.props.album_images.indexOf(this.state.next_img);
        var new_img;
        if (current_index !== this.props.album_images.length - 1) {
          new_img = this.props.album_images[current_index+1];
        } else {
          new_img = this.props.album_images[0];
          var myImage = new Image();
          myImage.src = new_img;
        }

          this.setState({
            img_source: new_img,
            center_style:styles.right_mid,
            next_img_style:styles.mid_left,
            selected_img: new_img
          })

        center = true;
      }

    },

    previousImg: function() {
      if(center){
        var current_index = this.props.album_images.indexOf(this.state.img_source);
        var new_img;
        if (current_index > 0) {
          new_img = this.props.album_images[current_index-1];
        } else if (current_index === 0 && this.props.album_images.length === 1) {
        } else {
          new_img = this.props.album_images[this.props.album_images.length - 1];
          var myImage = new Image();
          myImage.src = new_img;
        }

        this.setState({
          next_img: new_img,
          next_img_style:styles.left_mid,
          center_style:styles.mid_right,
          selected_img: new_img
        })

        center = false;
      }else {
        var current_index = this.props.album_images.indexOf(this.state.next_img);
        var new_img;
        if (current_index > 0) {
          new_img = this.props.album_images[current_index-1];
        } else if (current_index === 0 && this.props.album_images.length === 1) {
        } else {
          new_img = this.props.album_images[this.props.album_images.length - 1];
          var myImage = new Image();
          myImage.src = new_img;
        }
        this.setState({
          img_source: new_img,
          center_style:styles.left_mid,
          next_img_style:styles.mid_right,
          selected_img: new_img
        })
        center = true;
      }

    },

    componentDidMount: function() {

    },

    onMouseDownHandler: function() {

    },

    rotate_images: function() {
        var index = img_lst.indexOf(this.state.source);
        if (index !== img_lst.length - 1) {
            index += 1;
            this.setState({ source: img_lst[index] });
        } else {
            this.setState({ source: img_lst[0] });
        }
    },


    render:  function() {

      var main_back_image = {
        backgroundImage: 'url(' + this.state.img_source + ')'
      }
      var next_back_image = {
        backgroundImage: 'url(' + this.state.next_img + ')'
      }
      var main_div_style = $.extend(true, {}, main_back_image, this.state.center_style);
      var next_img_style = $.extend(true, {}, next_back_image, this.state.next_img_style);

        return    <div className="slideshow_container">
                    <Header friends_options = {this.props.friends_options} current_user = {this.props.current_user} user_albums = {this.props.user_albums} contr_albums = {this.props.contr_albums} />
                    <StyleRoot>
                      <div style={main_div_style} id="main_img_container" onMouseDown = {this.onMouseDownHandler} className={"main_img_container"}>
                      </div>
                      <div style={next_img_style} id="next_img_container" onMouseDown = {this.onMouseDownHandler} className={"next_img_container"}>
                      </div>
                    </StyleRoot>
                    <Thumbnail_Slider updateSelectedImg = {this.updateSelectedImg} album_images = {this.props.album_images} selected_img = {this.state.selected_img} />
                    <Next_IMG_Button nextImg = {this.nextImg}  />
                    <Previous_IMG_Button previousImg = {this.previousImg} />
                  </div>

    }
})
module.exports = Radium(Slideshow);

var Thumbnail_Slider = React.createClass({

render:function() {
  var width = ( this.props.album_images.length  * 9 + 2 )
  var thumb_style = {
    width : width+"em",
    margin: "0 auto"
  }
  return <div className="slider_container">
          <StyleRoot>
          <div className="thumbnail_container" style={thumb_style}>
            {
              this.props.album_images.map((x,y)=>{
                return <Thumbnail_Image updateSelectedImg = {this.props.updateSelectedImg} key={y} img_source = {x} selected_img = {this.props.selected_img} />
              })
            }
          </div>
          </StyleRoot>
        </div>
},

})

module.exports = Radium(Slideshow);
module.exports = Radium(Thumbnail_Slider);
var Thumbnail_Image = React.createClass({
  getInitialState:function () {
    return {
      updateSelectedImg:this.props.updateSelectedImg
    }
  },

  onMouseDownHandler: function () {
    this.state.updateSelectedImg(this.props.img_source)
  },

  render:function () {
    if(this.props.selected_img === this.props.img_source) {
        var background = {
        backgroundImage: 'url(' + this.props.img_source + ')',
        outline: 'none',
        boxshadow:'0px 1rem 1rem .5rem #333',
        border: '1pt blue solid'
      }
    }else {
      var background = {
        backgroundImage: 'url(' + this.props.img_source + ')'
      }
    }

    return <div onMouseDown = {this.onMouseDownHandler} className="thumbnail_img" style={background}>
          </div>
  }
})

// var Full_Screen_Button = React.createClass ({
//
// })

var Next_IMG_Button = React.createClass ({
  getInitialState: function () {
    return {
      nextImg: this.props.nextImg
    }

  },

  onMouseDownHandler: function () {
    this.state.nextImg()
  },

  render: function () {
    return <div onMouseDown = {this.onMouseDownHandler} id="main_img_right_arrow" className="main_img_right_arrow"></div>
  }
})

var Previous_IMG_Button = React.createClass ({
  getInitialState: function () {
    return {
      previousImg: this.props.previousImg
    }
  },
  onMouseDownHandler: function () {
    this.state.previousImg()
  },
  render: function () {
    return <div onMouseDown = {this.onMouseDownHandler} id="main_img_left_arrow" className="main_img_left_arrow"></div>
  }
})



function update_album_list(res) {
  var user_album_images = [{albums: []}];
  var contr_album_images = [{albums: []}];
    res.user_albums.map((x) => {
      if (user_album_images[user_album_images.length - 1].albums.length < 4) {
          user_album_images[user_album_images.length - 1].albums.push(x);
      } else {
          user_album_images.push({ albums: [x]});
      }
    })
    res.contr_albums.map((x) => {
      if (contr_album_images[contr_album_images.length - 1].albums.length < 4) {
          contr_album_images[contr_album_images.length - 1].albums.push(x);
      } else {
          contr_album_images.push({ albums: [x]});
      }
    })
  return [user_album_images,contr_album_images]
};


function get_albums(sorting_method,direction) {
    $.ajax({
        url: "/get/",
        method: "GET",
        data: {sorting_method:sorting_method,
               direction: direction
              }
    }).done(function (data) {
        albums = JSON.parse(data);
        profile_image = albums.picture
        var user_albums = albums.album_url_list['user_albums'];
        var contr_albums = albums.album_url_list['contr_albums'];
        ReactDOM.render(React.createElement(Album_Container, {current_user:albums.user, user_albums:user_albums, contr_albums:contr_albums}) , document.getElementById('main'));
    }).error(function (err) {
        console.log(err);
    });
}


function filter_row(image_list, row) {
    return image_list.map((src) => {
        if (src.row === row) {
            return src.images;
        }
    }).filter(function (x) {
        return (typeof x !== 'undefined')
      })
};

var File_Input = React.createClass({
      getInitialState: function () {
        return {
          album:this.props.album,
          author:this.props.author,
          updateLoad:this.props.updateLoad
        }
      },
        onChangeHandler: function(event) {
        this.state.updateLoad(true)
        var file = event.target.files[0];
        var reader = new FileReader();
        var mime_type= file.type;
        reader.onload = (event) => {
            uploadImg(event.target.result,this.state.album,this.state.author,mime_type);
        };
        reader.readAsDataURL(file);
    },

    render: function() {
        return  <div className="manual_upload">
                  <label htmlFor="file-input">
                  <img src="http://i.imgur.com/vhoHhIV.png"/>
                  </label>

                  <input id="file-input" onChange={this.onChangeHandler} type={"file"}/>
                  </div>


    }
});


function update_temp_img(images,number_of_images) {
  var loading = 'http://i.imgur.com/JzVkr04.gif'
  var img_lst = images
  for(var x = 0; x < number_of_images; x++) {
        img_lst.push(loading);
  }
  return img_lst
}

function replace_temp_img(res) {
    var loading = 'http://i.imgur.com/JzVkr04.gif'
    for(var y = 0; y < images.length; y++) {
        var done = false;
        for(var z = 0; z < images[y].images.length; z++) {
            if (images[y].images[z] === loading) {
                images[y].images[z] = res
                done = true;
                break;
            }
        }
        if (done) {
            break;
        }
    }
}

function update_img_list(res) {
  var images = []

  res.map((x) => {

  images.push({ images: [x], row: images.length });
  })
  return images
}

function remount_left(album_name, album_author, images,user_albums,contr_albums,current_user,friends,album_friends) {
    ReactDOM.unmountComponentAtNode(document.getElementById('main'));
    ReactDOM.render(React.createElement(Min_Container, {album_friends: album_friends, user_albums: user_albums, contr_albums: contr_albums, images: images, album_author: album_author, album_selected: album_name, current_user:current_user, friends_options:friends}), document.getElementById('main'));
    window.scrollTo(0, 0);
}


try {
    ReactDOM.render(React.createElement(File_Input), document.getElementById('upload'));
} catch (err) {

}

// window.onbeforeunload = function (e) {
//     return 'Please press the Logout button to logout.';
// };
function uploadImg(base64,album,author,mime_type) {
    var base64 = base64.replace(/^.*base64,/, '');
    $.ajax({
        method: 'POST',
        url: '/upload/s3/',
        data: {
            csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value,
            image: base64, // base64 string, not a data URI
            mime_type: mime_type
        }
    }).done((res) => {
        var result = JSON.parse(res);
        var url = result.url;
        // replace_temp_img(link);
        update_server_url(url,album,author);

        // saveFile(link);
    }).error(function (err) {
        console.log(err);
    });
}

function uploadImgur(base64,album,author) {
    var base64 = base64.replace(/^.*base64,/, '');

    $.ajax({
        method: 'POST',
        url: 'https://api.imgur.com/3/image',
        headers: {
            Authorization: 'Client-ID 4d075e399079cdc'
        },
        data: {

            image: base64
        }
    }).done((res) => {
        var link = res.data.link;
        update_server_url(link,album,author);
    }).error(function (err) {
        console.log(err);
    });
}

function uploadProfileImage(base64) {
    var base64 = base64.replace(/^.*base64,/, '');
    $.ajax({
        method: 'POST',
        url: 'https://api.imgur.com/3/image',
        headers: {
            Authorization: 'Client-ID 4d075e399079cdc'
        },
        data: {
            image: base64
        }
    }).done((res) => {
        var link = res.data.link;
        $('#new_user_profile_picture_url').val(link);
        var $url = $('#new_user_profile_picture_url').val();
        $('#new_user_profile_picture').css("background-size", "cover");
        $('#new_user_profile_picture').css("background-image", "url("+$url+")");
    }).error(function (err) {
        console.log(err);
    });
}

function update_server_url(url,album,author) {
    var result = { 'url': url, 'album':album, 'author':author, csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value };
    result = JSON.stringify(result);
    $.ajax({
        url: "/save/",
        method: "POST",
        data: result
    }).done(function (data) {
      temp_count -= 1;

      var result = JSON.parse(data);
      var img_result = result.images;
      for(var x = 0; x < temp_count; x++ ) {
          img_result.push('http://i.imgur.com/JzVkr04.gif')
      }
      var user_albums = result.albums.user_albums;
      var contr_albums = result.albums.contr_albums;
      var album_friends = result.album_friends;
      remount_left(result.album,result.author,img_result,user_albums,contr_albums,author,friends_options,album_friends)
      if(temp_count === 0) {
        load.updateImages(result.images)
        load.updateSelected(album_selected,album_author)
      }
    }).error(function (err) {
        console.log(err);
    });
}

function delete_url(res,album) {
    var result = { 'url': res, 'album': album, csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value };
    result = JSON.stringify(result);
    $.ajax({
        url: "/delete/",
        method: "POST",
        data: result
    }).done(function (data) {
      window.location.href = "/";
    }).error(function (err) {
        console.log(err);
    });
}

function delete_album(album) {
    var result = {'album': album, csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken').value };
    result = JSON.stringify(result);
    $.ajax({
        url: "/delete/album",
        method: "POST",
        data: result
    }).done(function (data) {
        var albums = JSON.parse(data);
        var user_albums = update_album_list(albums);
        var contr_albums = user_albums[1];
        user_albums = user_albums[0];
        ReactDOM.unmountComponentAtNode(document.getElementById('main'));
        ReactDOM.render(React.createElement(Album_Container,{user_albums:user_albums,contr_albums:contr_albums}), document.getElementById('main'));
    }).error(function (err) {
        console.log(err);
    });
}

function addEventHandler(obj, evt, handler) {
    if (obj.addEventListener) {
        // W3C method
        obj.addEventListener(evt, handler, false);
    } else if (obj.attachEvent) {
        // IE method.
        obj.attachEvent('on' + evt, handler);
    } else {
        // Old school method.
        obj['on' + evt] = handler;
    }
}

function getFriends(callback) {
  $.ajax({
      url: "/get/friends",
      method: "GET",
      data: {},
      async: false
  }).done((data) => {
      user_friends = JSON.parse(data);
      if(user_friends !== false) {
        user_friends.map((x)=>{
          friends_options.push({value:x['name'], label:x['name']})
        })
      }
      callback(friends_options)
  }).error(function (err) {
      console.log(err);
  });
}

function getUsers () {
  $.ajax({
      url: "get/users/all",
      method: "GET",
      data: {}
  }).done((data) => {
      global_users = JSON.parse(data);
  }).error(function (err) {
      console.log(err);
  });
}

function main() {

  try {
    get_albums("a-z","");
    getUsers();
  }catch(x) {
  }

}

main();
