# ERecipeHub Backend

A Node.js/Express backend server for the ERecipeHub recipe sharing platform.

## Features

- User authentication (signup, login, password change)
- Recipe management (create, read, update, delete)
- Image upload support (local storage and Cloudinary)
- Recipe rating and commenting system
- Favorite recipe functionality
- Search, sort, and filter recipes
- Environment-specific configurations

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM (Object Data Modeling)
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Cloud image storage
- **Jimp** - Image processing
- **CORS** - Cross-Origin Resource Sharing

## API Routes

### Authentication Routes (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - User login
- `POST /change-password` - Change user password

### Recipe Routes (`/api/recipes`)
- `GET /` - Get all recipes with filters
- `GET /:id` - Get single recipe
- `GET /:id/steps` - Get recipe steps
- `GET /:id/ingredients` - Get recipe ingredients
- `POST /:id/rate` - Rate a recipe
- `GET /:id/rate` - Get recipe rating
- `POST /:id/comment` - Add comment
- `GET /:id/comments` - Get recipe comments

### Recipe Management Routes
- `POST /api/addrecipes/add` - Create new recipe
- `GET /api/myrecipes` - Get user's recipes
- `PUT /api/edit-recipe/:id` - Update recipe
- `DELETE /api/edit-recipe/:id` - Delete recipe

### Favorite Recipe Routes (`/api/favorites`)
- `POST /add` - Add to favorites
- `DELETE /remove` - Remove from favorites
- `GET /check/:recipeId` - Check favorite status
- `GET /user/:userId` - Get user's favorites

### Upload Routes (`/api/uploads`)
- `POST /recipe` - Upload recipe image
- `POST /recipestep` - Upload step image

### Home Route (`/api/home`)
- `GET /` - Get latest and top-rated recipes

## Environment Variables

### Development (.env.development)
```env
NODE_ENV=development
PORT=10000
MONGODB_URI=mongodb://localhost:27017/test
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
STORAGE_TYPE=local
IMAGE_BASE_URL=http://localhost:10000
```

### Production (.env.production)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://erecipehub.onrender.com
STORAGE_TYPE=cloud
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Environment Variables Description

#### Common Variables
- `NODE_ENV`: Environment mode ('development' or 'production')
- `PORT`: Server port number
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `CLIENT_URL`: Frontend application URL for CORS

#### Development-specific Variables
- `STORAGE_TYPE`: Set to 'local' for local file storage
- `IMAGE_BASE_URL`: Base URL for serving local images

#### Production-specific Variables
- `STORAGE_TYPE`: Set to 'cloud' for Cloudinary storage
- `CLOUDINARY_URL`: Cloudinary connection string
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

### Setting Up Environment Variables

1. Create `.env.development` and `.env.production` files in the root directory
2. Copy the appropriate template above
3. Replace placeholder values with your actual credentials
4. Never commit these files to version control

### Important Notes

- Keep your JWT_SECRET secure and different between environments
- Use strong, unique passwords for MongoDB
- Protect your Cloudinary credentials
- Ensure CORS settings match your frontend URLs
- Use appropriate environment variables based on NODE_ENV

## How to Run

1. Install Node.js and MongoDB
2. Clone this repository
3. Install dependencies using `npm install`
4. Set up environment variables as described above
5. Start the server using `npm start`

## Contributing

Feel free to contribute to this project. Fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License.
