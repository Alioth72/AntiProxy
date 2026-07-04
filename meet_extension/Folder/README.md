AntiProxy Meet Integration

A professional, secure video-conferencing integration built with Next.js for the AntiProxy Meet platform. This project provides a clean, modular, and deployment-ready solution for embedding AntiProxy Meet sessions directly into your web applications.

Features

Plug-and-Play Integration: A reusable React component for embedding AntiProxy Meet sessions in any page

Customizable Settings: Configure room names, participant details, media options, streaming modes, and more

Secure Access: Supports JWT tokens for authenticated and premium feature access

Responsive & Modern UI: Works seamlessly across desktop, tablet, and mobile

Production-Ready: Includes best practices for sandboxing, iframe security, and environment variable handling

Modular Architecture: Clean component structure for easy extension and scaling

Getting Started
Prerequisites

Node.js 18+

npm or yarn

Installation

Clone or download the repository

Install dependencies:

npm install


Start the development server:

npm run dev


Open http://localhost:3000
 in your browser.

Configuration
Basic Setup

When embedding AntiProxy Meet, you can configure:

Room Name — Unique meeting identifier (e.g., team-sync-2025)

Display Name — What other participants will see

Email (optional) — For avatar or system metadata

Video/Audio Preferences — Start muted or unmuted

Using JWT Tokens

AntiProxy Meet supports JWT for:

Authenticated access

Recording

Live streaming

Moderation privileges

Premium controls

Steps:

Generate or obtain a JWT from your AntiProxy Meet provider

Add it to your configuration panel under JWT Token

The integration will automatically apply it to the session

⚠️ Never commit JWTs to GitHub or public codebases

Customization
AntiProxyEmbed Component Props
<AntiProxyEmbed
  roomName="my-session"
  userName="John Smith"
  userEmail="john@example.com"
  startWithVideoMuted={false}
  startWithAudioMuted={false}
  jwt="your-jwt-token"
  domain="meet.antiproxy.ai"
  onClose={() => {}}
  configOverwrite={{}}
  interfaceConfigOverwrite={{}}
/>

Styling (Tailwind)

Global theme tokens are defined in app/globals.css:

:root {
  --primary: oklch(0.45 0.25 250);
  --primary-foreground: oklch(1 0 0);
}


Modify colors, animations, and layouts directly here.

Security Best Practices
Environment Variables

Create .env.local:

NEXT_PUBLIC_ANTIPROXY_DOMAIN=meet.antiproxy.ai
ANTIPROXY_JWT_TOKEN=your_jwt_token_here


Use:

const token = process.env.ANTIPROXY_JWT_TOKEN


Only NEXT_PUBLIC_* variables are exposed to the client.

Iframe Sandboxing & CORS

AntiProxy Meet handles CORS internally, and this project includes:

Secure iframe configuration

Script isolation

Optional token-based authentication

Deployment
Deploy to Vercel (Recommended)

Push to GitHub/GitLab

Connect repo to Vercel

Add environment variables in the dashboard

Deploy instantly

Self-Hosted / Any Server
npm run build
npm start


Deploy the .next folder.

Docker
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]


Build & run:

docker build -t antipoxy-meet .
docker run -p 3000:3000 antipoxy-meet

Project Structure
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
├── components/
│   ├── antipoxy-embed.tsx
│   ├── config-panel.tsx
│   └── ui/
├── public/
├── next.config.mjs
├── tsconfig.json
└── package.json

API Reference
AntiProxyEmbed Component
Prop	Type	Default	Description
roomName	string	required	Unique meeting identifier
userName	string	required	Display name
userEmail	string	optional	Avatar/email metadata
startWithVideoMuted	boolean	false	Start with video off
startWithAudioMuted	boolean	false	Start with audio off
domain	string	"meet.antiproxy.ai"	AntiProxy Meet domain
jwt	string	optional	JWT for secure/premium access
onClose	function	optional	Callback on meeting end
configOverwrite	object	{}	Low-level config overrides
interfaceConfigOverwrite	object	{}	UI customization

Built-in event support:

sessionJoined

sessionLeft

participantJoined

participantLeft

readyToClose

Troubleshooting
AntiProxy Meet Not Loading?

Check console logs

Verify domain configuration

Ensure HTTPS in production

Confirm firewall/proxy isn't blocking WebRTC

Audio/Video Issues?

Check browser camera/mic permissions

Verify constraints in configOverwrite

Try another browser (Chrome recommended)

JWT Token Errors?

Ensure unexpired token

Validate signature

Verify provider permissions

Advanced Usage
Custom Configuration Example
<AntiProxyEmbed
  roomName="secure-session"
  userName="Admin"
  configOverwrite={{
    startVideoMuted: true,
    enableWelcomePage: false,
    disableInviteFunctions: true,
    p2p: { enabled: true },
  }}
  interfaceConfigOverwrite={{
    TOOLBOX_TIMEOUT: 4000,
    DISABLE_PRESENCE_STATUS: true,
  }}
/>

Server-Side Room Generation
export async function POST() {
  const meetingId = crypto.randomUUID()
  return Response.json({ roomName: `session-${meetingId}` })
}

Performance Optimizations

Lazy load the meeting SDK

Proper cleanup using dispose()

One script instance shared across sessions

Lightweight state management

Resources

AntiProxy Meet Handbook (internal)

Next.js Documentation

WebRTC Guidelines

Deployment Best Practices

License

MIT License — free for commercial and personal use.

Contributing

PRs and suggestions are welcome!