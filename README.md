
## Project Overview:
This web app allows for cloud storing of images on an s3 cloud server. The user can create albums and organize their photos. These albums can be shared with other users who can then upload photos to these albums.

## Live Demo

* Live Demo: [digitalphoto.cloud](https://digitalphotocloud.herokuapp.com/admin/)


## Local Installation & Requirements

* Python 3.5 required [docs.python.org/3/using](https://docs.python.org/3/using/mac.html)

* Run pip install -r requirements.txt in root directory after setting up a virtual environment

* Run npm install - in root directory

* Use webpack to edit any code in index.js

## Technical Components:
* Front End
  * REACT JS
    - Used for rendering entire front-end HTML
    - Quick virtual DOM manipulations  
  * JAVASCRIPT
   - AJAX
   - JQuerY
  * CSS3
* Back End
  * Python
    - Django application
  * Postgresql database
    - Stores user account information as well as image storing information
  * Amazon S3 cloud server database
    - used to store all images on cloud server
  * Heroku Deployment
