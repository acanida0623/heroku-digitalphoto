
## Project Overview:
This web app allows for cloud storing of images on an s3 cloud server. The user can create albums and organize their photos. These albums can be shared with other users who can then upload photos to these albums.

## Live Demo

* Live Demo: [digitalphoto.cloud](https://www.digitalphoto.cloud)


## Installation & Requirements

* Python 3.5 required [docs.python.org/3/using](https://docs.python.org/3/using/mac.html)

* Run pip install - in root directory

* Run npm install - in root directory


## Data Model:

* UserProfile
    * user = OneToOne(User)
	* profile_picture
* Image
  * author = ForeignKey(UserProfile)
  * url
  * album_name
  * created_date
* Album
  * author = ForeignKey(UserProfile)
  * shared_users
  * images = ManyToMany(Image)
  * name
  * created_date

## Technical Components:
* Front End
  * HTML/class
  * JAVASCRIPT
   * AJAX
   * REACT JS
   * Some JQuerY
* Back End
  * Python
    - All server side code will be written in python
  * Amazon S3 cloud server
    - this will handle the storage of all images/files
  * Docker virtual machine
    - will be used to create a virtual environment, allowing the python based server app to run in production
  * Digital Ocean
    - Used to host the app to a navigable ip on the web

