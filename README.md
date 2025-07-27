# 📱 Reddit-Style Feed App



If I had to scale this app to 1 million users in India, here are the key changes I would prioritize:

• **Regional Infrastructure**: Deploy Supabase instances in Mumbai/Delhi AWS regions to reduce latency from 200ms+ to under 50ms for Indian users, with CDN edge locations across major cities

• **Offline-First Architecture**: Implement aggressive caching and offline sync since 40% of Indian users experience intermittent connectivity, using React Query with optimistic updates and conflict resolution

• **Localization & Regional Content**: Add Hindi/regional language support, implement content moderation for local cultural sensitivities, and create region-specific tag categories (e.g., "JEE/NEET", "UPSC", "Cricket")

• **Performance Optimization**: Implement virtual scrolling for feeds, lazy loading images with WebP format, and reduce bundle size by 60% through code splitting and tree shaking to handle slower 3G connections

• **Monetization Strategy**: Integrate UPI payments for premium features, implement regional ad networks, and create tiered subscription models optimized for Indian purchasing power and usage patterns



A modern, full-stack React Native (Expo) application with Supabase backend, featuring personalized feeds, image uploads, and Google authentication.

## 🚀 Features

### **Core Functionality**
- ✅ **Google Sign-In** via Supabase Auth
- ✅ **Global Feed** - View all posts from the community
- ✅ **Personalized Feed** - Posts tailored to your interests
- ✅ **Create Posts** - Share thoughts with title, description, tags, and images
- ✅ **Edit Posts** - Update your own posts
- ✅ **Image Upload** - Upload images to Supabase Storage
- ✅ **Tag System** - Filter posts by tags and manage interests

### **UI/UX Features**
- 🎨 **Modern Design** - Reddit-inspired orange theme
- 📱 **Responsive Layout** - Works on all device sizes
- 🔄 **Pull-to-Refresh** - Refresh feeds with swipe gesture
- 🏷️ **Tag Filtering** - Filter posts by popular tags or interests
- 👤 **User Avatars** - Rounded avatars with user initials
- ⏰ **Time Stamps** - Relative time display (e.g., "2h ago")

### **Personalization**
- 🎯 **Interest Management** - Add/remove tags you're interested in
- 🔍 **Smart Filtering** - Personalized feed based on your interests
- 📊 **Popular Tags** - Discover trending topics
- 🎨 **Visual Tag System** - Color-coded tag pills

## 🛠️ Tech Stack

### **Frontend**
- **React Native** (Expo) - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **Tailwind CSS** (NativeWind) - Utility-first styling
- **Expo ImagePicker** - Image selection from device gallery

### **Backend**
- **Supabase** - Backend-as-a-Service
  - **PostgreSQL Database** - Relational data storage
  - **Supabase Auth** - Google OAuth authentication
  - **Supabase Storage** - Image file storage
  - **Row-Level Security (RLS)** - Data security policies

### **Libraries**
- **@supabase/supabase-js** - Supabase client
- **expo-auth-session** - OAuth authentication
- **expo-image-picker** - Image selection
- **react-native** - Core mobile framework

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Supabase Account** - [Sign up here](https://supabase.com)
- **Google Cloud Console** - For OAuth setup

## 🚀 Installation & Setup

### **1. Clone and Install Dependencies**

```bash
# Navigate to project directory
cd reddit-feed-app

# Install dependencies
npm install

# Install additional required packages
npx expo install expo-image-picker
```

### **2. Supabase Setup**

#### **A. Create Supabase Project**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note your **Project URL** and **anon public key**

#### **B. Configure Environment**
Update `lib/supabase.ts` with your Supabase credentials:

```typescript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

#### **C. Database Schema**
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Posts table
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  description text,
  tags text[],
  image_url text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- User interests table
create table public.user_interests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  tag text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, tag)
);

-- Enable RLS
alter table public.posts enable row level security;
alter table public.user_interests enable row level security;

-- Posts policies
create policy "Users can view all posts"
  on public.posts for select using (true);

create policy "Users can insert their own posts"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete using (auth.uid() = user_id);

-- User interests policies
create policy "Users can manage their own interests"
  on public.user_interests for all using (auth.uid() = user_id);
```

#### **D. Storage Setup**
1. Go to **Storage** in Supabase Dashboard
2. Create bucket named `post-images`
3. Set bucket to **Public**
4. Run these storage policies:

```sql
-- Storage policies for image uploads
create policy "Users can upload images"
  on storage.objects for insert
  with check (auth.role() = 'authenticated' and bucket_id = 'post-images');

create policy "Public read access to images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Users can update their images"
  on storage.objects for update
  using (auth.role() = 'authenticated' and bucket_id = 'post-images');

create policy "Users can delete their images"
  on storage.objects for delete
  using (auth.role() = 'authenticated' and bucket_id = 'post-images');
```

### **3. Google OAuth Setup**

#### **A. Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

#### **B. Supabase Auth Configuration**
1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Google** provider
3. Add your Google Client ID and Client Secret
4. Save configuration

### **4. Run the Application**

```bash
# Start the development server
npx expo start

# Run on web
npx expo start --web

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## 📱 App Structure

```
reddit-feed-app/
├── src/
│   ├── components/
│   │   ├── Header.tsx          # App header with user avatar
│   │   └── Footer.tsx          # Navigation footer
│   ├── screens/
│   │   ├── AuthScreen.tsx      # Google sign-in screen
│   │   ├── CreatePostScreen.tsx # Create/edit posts
│   │   ├── GlobalFeedScreen.tsx # All posts feed
│   │   └── PersonalizedFeedScreen.tsx # Personalized feed
│   └── utils/
│       └── imageUpload.ts      # Image upload utilities
├── lib/
│   └── supabase.ts            # Supabase client configuration
├── App.tsx                    # Main app component
└── package.json
```

## 🎯 Key Features Explained

### **Authentication Flow**
1. **Google Sign-In** → OAuth via Supabase Auth
2. **User Creation** → Automatic user profile creation
3. **Session Management** → Persistent login state
4. **Sign Out** → Clear session and redirect to auth

### **Feed System**
- **Global Feed**: Shows all posts with tag filtering
- **Personalized Feed**: Shows posts matching user interests
- **Tag Management**: Add/remove interests for personalization
- **Real-time Updates**: Pull-to-refresh functionality

### **Post Creation**
- **Rich Form**: Title, description, tags, images
- **Image Upload**: Direct upload to Supabase Storage
- **Tag System**: Comma-separated tags for categorization
- **Edit Functionality**: Update your own posts

### **Image Handling**
- **Device Gallery**: Pick images from device
- **Supabase Storage**: Secure cloud storage
- **Public URLs**: CDN-optimized image delivery
- **Responsive Display**: Proper scaling in feeds

## 🔧 Configuration

### **Environment Variables**
Create `.env` file (optional):
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### **App Configuration**
- **Scheme**: `redditfeedapp` (for OAuth redirects)
- **Permissions**: Camera roll access for image picker
- **Storage**: Public bucket for image display

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Image Upload 403 Error**
```bash
# Solution: Run storage policies in Supabase SQL Editor
create policy "Users can upload images"
  on storage.objects for insert
  with check (auth.role() = 'authenticated' and bucket_id = 'post-images');
```

#### **2. Google Sign-In Not Working**
- Check Google Cloud Console redirect URIs
- Verify Supabase Auth provider configuration
- Ensure project URL is correct

#### **3. Database Connection Issues**
- Verify Supabase URL and anon key
- Check RLS policies are applied
- Ensure tables exist in database

#### **4. Image Picker Permissions**
```bash
# Install expo-image-picker if not installed
npx expo install expo-image-picker
```

### **Development Commands**
```bash
# Clear Metro cache
npx expo start -c

# Reset dependencies
rm -rf node_modules && npm install

# Update Expo SDK
npx expo install --fix
```

## 📊 Database Schema

### **Tables**
- **`users`**: User profiles (linked to Supabase Auth)
- **`posts`**: User posts with metadata
- **`user_interests`**: User tag preferences

### **Relationships**
- Users → Posts (one-to-many)
- Users → Interests (one-to-many)
- Posts → Tags (array relationship)

## 🎨 UI Components

### **Design System**
- **Primary Color**: `#FF4500` (Reddit orange)
- **Background**: `#f8f9fa` (Light gray)
- **Cards**: White with subtle shadows
- **Typography**: System fonts with proper hierarchy

### **Components**
- **Header**: App logo, user avatar, sign-out
- **Footer**: Tab navigation with icons
- **Post Cards**: Rich content with images and metadata
- **Tag Pills**: Interactive tag filtering
- **Forms**: Modern input fields with validation

## 🔒 Security Features

- **Row-Level Security (RLS)**: Database-level access control
- **Authenticated Uploads**: Only signed-in users can upload
- **User-Specific Data**: Users can only edit their own posts
- **Public Read Access**: Images and posts are publicly readable
- **OAuth Security**: Google's secure authentication

## 🚀 Deployment

### **Expo Build**
```bash
# Build for production
npx expo build:android
npx expo build:ios

# Or use EAS Build
npx eas build --platform all
```

### **Supabase Production**
- Use production Supabase project
- Configure production Google OAuth
- Set up custom domains if needed

## 📈 Future Enhancements

- [ ] **Comments System** - Add comments to posts
- [ ] **Like/Dislike** - Voting system
- [ ] **User Profiles** - Detailed user pages
- [ ] **Search Functionality** - Search posts and users
- [ ] **Push Notifications** - Real-time updates
- [ ] **Offline Support** - Cache posts for offline viewing
- [ ] **Dark Mode** - Theme switching
- [ ] **Post Sharing** - Share posts to social media

## 🚀 Scaling to 1 Million Users in India


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service
- **Expo** for the amazing React Native development platform
- **React Native** community for the robust mobile framework
- **Tailwind CSS** for the utility-first styling approach

---

**Built with ❤️ using React Native, Expo, and Supabase** 