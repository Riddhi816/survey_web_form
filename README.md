## 🚀 Deployment

To deploy the survey on any web server:

- Run `npm run build` in the project root.  
- This will generate a `/build` folder with all necessary static files.  
- Upload the contents of the `/build` folder to any web server (e.g., Apache, Nginx, university server).  
- The survey will work as a static website and connect to Firebase in real time — no backend setup is required.

## 🔍 How to View Survey Data (Firebase Access)

You do NOT need to run Firebase locally to view results.

If you have access to the Firebase project:
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Select the project: code-skills-survey
3. Navigate to **Firestore Database**
4. View the collection named `surveyResponses`

📝 All submitted survey data is stored there in real time.
