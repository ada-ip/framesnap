# FrameSnap - A Social Network Based on Images
## About the project
FrameSnap is a personalized social media platform inspired by other popular image-based social media platforms. The distinguishing feature of FrameSnap is that it allows users to create new timelines and customize them according to their preferences, providing a more personalized user experience.

This app was developed as the CFGS Desarrollo de Aplicaciones Web final project.

## Features
* User registration.
* Image uploads / post creation: users can post images with captions.
* Image tagging: users can tag their posts to make them easier to find.
* Profile customization: users can upload a profile picture.
* User interaction: users can follow other users and mark as favourites their posts.
* Customized timelines: users can create their own timelines based on their preferences. This includes choosing certain users or specific tags to follow, choosing the age of the posts they want to see, and organize them however they want.
* Search Functionality: users can find other users by name, and they can also find posts by tags.
### To do:
* Notification system.
* Direct messaging between users.
* Commenting on posts.

## Built with
### Frontend:

* HTML5. 
* CSS3.
* JavaScript.
* Bootstrap v5.

### Backend:

* Node.js v16.
* Express v4.
* MongoDB.
* Mongoose v7.
* AWS S3.
* EJS (Embedded JavaScript Templating).

## Architecture
FrameSnap has been developed using the Model-View-Controller (MVC) pattern.

## Challenges
One of the significant challenges faced during the development of FrameSnap was managing atypical data associated with users and posts in MongoDB. This was addressed by basing the design of the database on the Outlier Pattern. This pattern consists of choosing an optimal database design for the majority of use cases and process atypical data (outliers) in a different way.

## Deployment
The app is deployed and can be accessed at [framesnap.onrender.com](https://framesnap.onrender.com/).

## Usage
### Prerequisites
Ensure you have installed the correct version of Node.js.

### Installing
* Clone the repo: git clone https://github.com/ada-ip/framesnap.git
* Install NPM packages: npm install.
* Add your AWS S3 credentials, MongoDB connection string and a express session secret in a .env file.
* Run the app: node app.js or npm start.

# License
This project is licensed under the MIT License - see the LICENSE.md file for details.
