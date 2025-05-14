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
- Admin dashboard and management
- Content reporting system
- User role management (admin/regular users)
- Recipe search with multiple filters and sorting options

## Tech Stack

- **Node.js** - Runtime environment for executing JavaScript server-side.
- **Express** - Lightweight and flexible web framework for building APIs and web applications.
- **MongoDB** - NoSQL database for storing application data.
- **Mongoose** - Object Data Modeling (ODM) library for MongoDB, providing schema-based data modeling.
- **JWT (JSON Web Tokens)** - For secure authentication and authorization.
- **Bcrypt.js** - Password hashing for securing user credentials.
- **Multer** - Middleware for handling file uploads in Node.js.
- **Cloudinary** - Cloud-based storage for managing and delivering images and videos.
- **Jimp** - JavaScript library for basic image processing tasks.
- **CORS** - Middleware for enabling Cross-Origin Resource Sharing.
- **Dotenv** - For managing environment variables in a `.env` file.
- **zxcvbn** - Password strength estimation library for secure user registration.

### Development Tools
- **Nodemon** - Automatically restarts the server when file changes are detected, streamlining development.
- **Cross-Env** - Enables cross-platform compatibility for setting environment variables in scripts.

## System Architecture

The backend follows a modular architecture with the following components:

### Server Configuration
- **server.js** - Main entry point that configures Express, connects to MongoDB, and sets up routes
- **Environment-specific configuration** - Using dotenv to load different configurations based on environment

### Database Models
The application uses Mongoose schemas to define the following models:

- **User** - Stores user information including authentication details and role
- **Recipe** - Core recipe information (title, description, cooking time, etc.)
- **RecipeIngredient** - Ingredients associated with recipes
- **RecipeStep** - Step-by-step cooking instructions for recipes
- **Rate** - User ratings for recipes
- **Comment** - User comments on recipes
- **FavoriteRecipe** - User's saved/favorite recipes
- **Report** - Content reporting system for moderation

### Middleware
- **Authentication** - JWT-based authentication middleware
- **CORS Configuration** - Cross-origin resource sharing settings
- **Error Handling** - Global error handling middleware

### Routes
Organized by feature into separate route files, each handling a specific aspect of the application.

## API Routes

### Authentication Routes (`/api/auth`)
- `POST /signup` - Register new user
  - Validates email and username uniqueness
  - Checks password strength using zxcvbn
  - Returns JWT token on successful registration
- `POST /login` - User login
  - Authenticates user credentials
  - Returns JWT token and user details including role
- `POST /change-password` - Change user password
  - Requires authentication
  - Validates current password before allowing change

### Recipe Routes (`/api/recipes`)
- `GET /` - Get all recipes with filters
  - Supports search by title, description, or cuisine
  - Supports filtering by cuisine
  - Supports sorting by date, rating, or title
  - Returns aggregated data including average ratings
- `GET /:id` - Get single recipe with details
- `GET /:id/steps` - Get recipe steps in order
- `GET /:id/ingredients` - Get recipe ingredients
- `POST /:id/rate` - Rate a recipe (1-5 stars)
- `GET /:id/rate` - Get recipe rating statistics
- `POST /:id/comment` - Add comment to a recipe
- `GET /:id/comments` - Get all comments for a recipe

### Recipe Management Routes
- `POST /api/addrecipes/add` - Create new recipe
  - Saves main recipe data
  - Creates associated ingredients and steps
  - Handles image URLs
- `GET /api/myrecipes` - Get user's recipes
  - Requires authentication
  - Returns only recipes created by the authenticated user
- `PUT /api/edit-recipe/:id` - Update recipe
  - Updates main recipe data
  - Replaces all ingredients and steps
- `DELETE /api/edit-recipe/:id` - Delete recipe
  - Removes recipe and all associated data
  - Cleans up related images if using local storage

### Favorite Recipe Routes (`/api/favorites`)
- `POST /add` - Add recipe to user's favorites
- `DELETE /remove` - Remove recipe from favorites
- `GET /check/:recipeId` - Check if a recipe is in user's favorites
- `GET /user/:userId` - Get all favorites for a specific user

### Upload Routes (`/api/uploads`)
- `POST /recipe` - Upload main recipe image
  - Handles both local storage and Cloudinary based on environment
- `POST /recipestep` - Upload step-by-step instruction images
  - Processes and optimizes images before storage

### Home Route (`/api/home`)
- `GET /` - Get latest and top-rated recipes for homepage
  - Returns both newest recipes and highest-rated recipes

### Admin Routes (`/api/admin`)
- `GET /overview` - Get admin dashboard statistics
  - Total users, recipes, comments, and ratings
  - Recent activity metrics
- `GET /user-overview` - Get user management data
  - List of all users with activity statistics
  - User creation dates and roles
- `GET /recipe-overview` - Get recipe management data
  - All recipes with detailed information for admin review
- `DELETE /recipes/:recipeId` - Delete recipe (admin only)
- `DELETE /comments/:commentId` - Delete comment (admin only)

### Report Routes (`/api/reports` & `/api/admin/reports`)
- `POST /create` - Create new content report
  - Can report recipes or comments
  - Includes reason and description
- `GET /content/:contentId` - Get all reports for specific content
- `GET /reports` - Get all reports (admin only)
- `GET /reports/:reportId` - Get single report details (admin only)
- `PUT /reports/:reportId/status` - Update report status (admin only)
  - Can mark as resolved or rejected

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
- Admin routes are protected and require admin role
- Report management is restricted to admin users

## Database Models

### User Model
```javascript
{
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}
```

### Recipe Model
```javascript
{
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  servings: { type: Number },
  cooking_time: { type: Number },
  prep_time: { type: Number },
  cuisine: { type: String, required: true },
  image_url: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}
```

### RecipeIngredient Model
```javascript
{
  recipe_id: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  ingredient_number: { type: Number, required: true },
  ingredient_name: { type: String, required: true },
  quantity: { type: String, required: true }
}
```

### RecipeStep Model
```javascript
{
  recipe_id: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  step_number: { type: Number, required: true },
  description: { type: String, required: true },
  image_url: { type: String }
}
```

### Rate Model
```javascript
{
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipe_id: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  rated_at: { type: Date, default: Date.now }
}
```

### Comment Model
```javascript
{
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipe_id: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
}
```

### FavoriteRecipe Model
```javascript
{
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipe_id: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  saved_at: { type: Date, default: Date.now }
}
```

### Report Model
```javascript
{
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportedContentId: { type: Schema.Types.ObjectId, required: true },
  reportedContentType: { type: String, enum: ['recipe', 'comment'], required: true },
  reason: { type: String, enum: ['SPAM', 'INAPPROPRIATE', 'COPYRIGHT', 'OTHER'], required: true },
  description: { type: String, default: null },
  status: { type: String, enum: ['pending', 'resolved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}
```

## How to Run Locally

1. Prerequisites:
   - Node.js (v18 or higher)
   - MongoDB installed locally (v4.4 or higher)
   - Git
   - NPM or Yarn

2. Clone the Repository:
   ```bash
   git clone https://github.com/yongdilun/ERecipeBack.git
   cd ERecipeBack
   ```

3. Install Dependencies:
   ```bash
   npm install
   ```

4. Set Up Environment Variables:
   - Create `.env.development` file in the root directory
   ```env
   NODE_ENV=development
   PORT=10000
   MONGODB_URI=mongodb://localhost:27017/test
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:3000
   STORAGE_TYPE=local
   IMAGE_BASE_URL=http://localhost:10000
   ```

5. Create Required Directories:
   ```bash
   mkdir -p public/images/recipes
   mkdir -p public/images/steps
   ```

6. Start MongoDB:
   ```bash
   # Windows
   "C:\Program Files\MongoDB\Server\{version}\bin\mongod.exe"

   # macOS/Linux
   mongod
   ```

7. Start the Development Server:
   ```bash
   npm run dev
   ```

8. Verify Installation:
   - Open http://localhost:10000/api/health
   - Should see a JSON response with server status

9. Common Issues and Troubleshooting:
   - Port 10000 already in use: Change PORT in .env.development
   - MongoDB connection failed: Ensure MongoDB is running and check connection string
   - Image upload fails: Check public/images directory permissions
   - JWT errors: Make sure JWT_SECRET is properly set
   - CORS issues: Verify CLIENT_URL matches your frontend application URL

## Production Deployment

1. Set up your production environment (e.g., Render, Heroku, AWS)
2. Configure environment variables for production
3. For image storage, set up a Cloudinary account and configure the related variables
4. Deploy using the following command:
   ```bash
   npm start
   ```

## API Testing

You can test the API endpoints using tools like Postman or cURL. Here are some example requests:

### Testing Authentication
```bash
# Register a new user
curl -X POST http://localhost:10000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"StrongPassword123"}'

# Login
curl -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"StrongPassword123"}'
```

### Testing Recipe Endpoints
```bash
# Get all recipes
curl -X GET http://localhost:10000/api/recipes

# Get a specific recipe (replace RECIPE_ID with an actual ID)
curl -X GET http://localhost:10000/api/recipes/RECIPE_ID

# Create a recipe (requires authentication)
curl -X POST http://localhost:10000/api/addrecipes/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_id": "USER_ID",
    "title": "Test Recipe",
    "description": "A test recipe description",
    "servings": 4,
    "cookingTime": 30,
    "prepTime": 15,
    "cuisine": "Italian",
    "image_url": "http://example.com/image.jpg",
    "ingredients": [
      {"name": "Ingredient 1", "quantity": "1 cup"},
      {"name": "Ingredient 2", "quantity": "2 tbsp"}
    ],
    "instructions": [
      {"step": "Step 1 description", "image": ""},
      {"step": "Step 2 description", "image": ""}
    ]
  }'
```

## Health Check and Monitoring

The backend includes a health check endpoint at `/api/health` that provides information about:
- Server status
- MongoDB connection state
- Available collections
- Environment configuration

This is useful for monitoring the application and diagnosing issues in both development and production environments.

## Security Considerations

1. **Authentication**: The system uses JWT for authentication with token expiration
2. **Password Security**:
   - Passwords are hashed using bcrypt before storage
   - Password strength is checked using zxcvbn during registration
3. **Input Validation**: All user inputs are validated before processing
4. **Environment Variables**: Sensitive information is stored in environment variables
5. **CORS Configuration**: API is protected with proper CORS settings

## Contributing

Feel free to contribute to this project. Fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License.
