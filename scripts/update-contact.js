const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Parse .env manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1).replace(/\\n/g, '\n');
    }
    env[key] = value;
  }
});

const projectId = env.FIREBASE_PROJECT_ID || "morethanme-b4623";
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKey = env.FIREBASE_PRIVATE_KEY;

if (!clientEmail || !privateKey) {
  console.error("Credentials missing in .env");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey })
});

const db = admin.firestore();

async function run() {
  await db.collection("site_settings").doc("contact_email").set({ value: "morethanme@rishihood.edu.in" }, { merge: true });
  console.log("✓ Firebase site_settings.contact_email updated successfully to morethanme@rishihood.edu.in");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
