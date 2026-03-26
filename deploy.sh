#!/bin/bash

echo "🚀 Deploying TrackMyJobs\n"

# Deploy backend to Render
echo "📦 Deploying backend to Render..."
git push origin main
echo "✅ Backend deployed"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 30

# Setup database
echo "📊 Setting up database..."
curl -X POST https://api.render.com/v1/services/srv-xxx/deploys \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Deploy frontend to Netlify
echo "🎨 Deploying frontend to Netlify..."
cd client
npm run build
netlify deploy --prod --dir=build
cd ..

echo "\n✅ Deployment complete!"
echo "🌐 Backend: https://trackmyjobs-api.onrender.com"
echo "🌐 Frontend: https://track-myjobs.netlify.app/login"
echo "🔑 Health Check: https://trackmyjobs-api.onrender.com/health"