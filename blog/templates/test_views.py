<div className="what">
<img src={album_cover} />
<div className="circle1"></div>
<div className="circle2"></div>
<div className="circle3"></div>
<div className="title_cont"><p>{this.props.album_name}</p></div>
</div>






<div class="page-header" id="page-header" >
{% if user.is_authenticated %}

<div class="top-menu">
<input id="search_album" placeholder="Search" />

<div id="back_albums">
<span>
Albums
</span>
</div>

<div id="create_new_album">
<span>
New Album
</p>
</span>
</div>
<div id="upload_new">
<span>
Upload

</span>
</div>

<label class="switch">
<input id="imgur_check" type="checkbox" >
<div class="slider round"></div>
</label>

<span id="hello_user">Hello {{ user.username }}(<a href="{% url 'logout_the_user' %}">Log out</a>)</span>

</div>

{% else %}
<a href="{% url 'blog.views.login_home' %}" class="top-menu"><span class="glyphicon glyphicon-lock"></span></a>
{% endif %}
</div>







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
             <Sort_User_Albums visible={this.state.album_settings_visible} updateAlbumOrder = {this.props.updateAlbumOrder} />
           </div>
  }

})

var Sort_User_Albums = React.createClass({
  getInitialState: function () {
    return {
      background:"#000000",
      selected: false
    }

  },

  onMouseOverHandler:function () {
    if(this.state.selected) {
    }else {
      this.setState({
        background:"#1B1B1B"
      })
    }

  },

  onMouseLeaveHandler: function() {
    if(this.state.selected) {
    }else {
      this.setState({
        background:"#000000"
      })
    }

  },

  onMouseDownHandler: function () {
    if(this.state.selected) {
      this.setState({
        background:"#000000",
        selected: false
      })
    }else {
      this.setState({
        background:"#1B1B1B",
        selected: true
      })
    }

  },

  render: function () {

    var divStyle = {
      background:this.state.background
    }
    if(this.props.visible) {
      if(this.state.selected) {
        return  <div>
                  <div onMouseLeave = {this.onMouseLeaveHandler} onMouseOver = {this.onMouseOverHandler} onMouseDown = {this.onMouseDownHandler} id="sort_user_albums" style={divStyle}>
                    <span>Sort Albums  ></span>
                  </div>
                  <Sort_User_Albums_Container updateAlbumOrder = {this.props.updateAlbumOrder} />
                </div>
      }else{
        return  <div>
                  <div onMouseLeave = {this.onMouseLeaveHandler} onMouseOver = {this.onMouseOverHandler} onMouseDown = {this.onMouseDownHandler} id="sort_user_albums" style={divStyle}>
                    <span>Sort Albums  ></span>
                  </div>
                </div>
      }
    }else {
      return <div>
            </div>
    }




  }
})

var Sort_User_Albums_Container = React.createClass({
  render: function () {

      return <div id="sort_user_albums_container">
              <Sort_User_Albums_A_Z updateAlbumOrder = {this.props.updateAlbumOrder} />
              <Sort_User_Albums_Date_Created updateAlbumOrder = {this.props.updateAlbumOrder} />
              <Sort_User_Albums_Image_Count updateAlbumOrder = {this.props.updateAlbumOrder} />
            </div>
  }
})

var Sort_User_Albums_A_Z = React.createClass({
  getInitialState: function () {
    return {
      background:"#000000",
      updateAlbumOrder: this.props.updateAlbumOrder,
      direction: ""
    }

  },

  onMouseOverHandler:function () {
      this.setState({
        background:"#1B1B1B"
      })
  },

  onMouseLeaveHandler:function () {
      this.setState({
        background:"#000000"
      })
  },

  onMouseDownHandler: function() {
    this.updateOrder()
    if(this.state.direction === "") {
      this.setState({
        direction: "-"
      })
    }else {
      this.setState({
        direction: ""
      })
    }
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
      background:this.state.background
    }
    return <div onMouseDown = {this.onMouseDownHandler} onMouseLeave = {this.onMouseLeaveHandler} onMouseOver = {this.onMouseOverHandler} id="sort_user_albums_A_Z" style={divStyle}>
            <span>A - Z </span>
           </div>
  }
})

var Sort_User_Albums_Date_Created = React.createClass({
  getInitialState: function () {
    return {
      background:"#000000",
      updateAlbumOrder: this.props.updateAlbumOrder,
      direction: ""
    }
  },

  onMouseOverHandler:function () {
      this.setState({
        background:"#1B1B1B"
      })
  },

  onMouseLeaveHandler:function () {
      this.setState({
        background:"#000000"
      })
  },

  onMouseDownHandler: function() {
    this.updateOrder()
    if(this.state.direction === "") {
      this.setState({
        direction: "-"
      })
    }else {
      this.setState({
        direction: ""
      })
    }
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
      background:this.state.background
    }
    return <div onMouseDown = {this.onMouseDownHandler} onMouseLeave = {this.onMouseLeaveHandler} onMouseOver = {this.onMouseOverHandler} id="sort_user_albums_date_created" style={divStyle}>
            <span>Date Created</span>
           </div>
  }
})

var Sort_User_Albums_Image_Count = React.createClass({
  getInitialState: function () {
    return {
      background:"#000000",
      updateAlbumOrder: this.props.updateAlbumOrder,
      direction: ""
    }
  },

  onMouseOverHandler:function () {
      this.setState({
        background:"#1B1B1B"
      })
  },

  onMouseLeaveHandler:function () {
      this.setState({
        background:"#000000"
      })
  },

  onMouseDownHandler: function() {
    this.updateOrder()
    if(this.state.direction === "") {
      this.setState({
        direction: "-"
      })
    }else {
      this.setState({
        direction: ""
      })
    }
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
      background:this.state.background
    }
    return <div onMouseDown = {this.onMouseDownHandler} onMouseLeave = {this.onMouseLeaveHandler} onMouseOver = {this.onMouseOverHandler} id="sort_user_albums_image_count" style={divStyle}>
            <span>Image Count</span>
           </div>
  }
})
