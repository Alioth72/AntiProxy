# Jitsi Meet Integration

A professional video conferencing application built with Next.js that integrates Jitsi Meet's SaaS components. This project provides a clean, modular, and deployment-ready solution for embedding Jitsi video conferencing into your web applications.

## Features

- **Easy Integration**: Simple, reusable React component for Jitsi Meet embedding
- **Customizable Settings**: Configure room names, user details, and media settings
- **Security**: Support for JWT tokens for premium features and secure access
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Production Ready**: Best practices for security, CORS, and iframe sandboxing
- **Modular Code**: Well-organized components and utilities for easy extension

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Clone or download this project
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Start the development server:

\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### Basic Setup

1. **Room Name**: Unique identifier for your meeting (e.g., "quarterly-review-2025")
2. **User Display Name**: How you'll appear to other participants
3. **Email** (optional): For gravatar integration
4. **Media Settings**: Control initial video/audio mute state

### Using JWT Tokens

For premium Jitsi features (recording, outbound calls, live streaming):

1. Obtain a JWT token from your Jitsi Meet provider
2. Paste it in the "JWT Token" field in the configuration panel
3. The token will be used to enable premium features

**Important**: Keep JWT tokens private. Never commit them to version control.

## Customization

### Jitsi Component Props

\`\`\`typescript
<JitsiEmbed
  roomName="my-meeting"              // Room identifier
  userName="John Smith"               // Display name
  userEmail="john@example.com"        // Optional email
  startWithVideoMuted={false}         // Video state
  startWithAudioMuted={false}         // Audio state
  jwt="your-jwt-token"                // Optional JWT
  domain="8x8.vc"                     // Jitsi domain
  onClose={() => {}}                  // Close handler
  configOverwrite={{}}                // Custom Jitsi config
  interfaceConfigOverwrite={{}}       // Custom UI config
/>
\`\`\`

### Styling

The project uses Tailwind CSS with semantic design tokens. Customize colors in `app/globals.css`:

\`\`\`css
:root {
  --primary: oklch(0.45 0.25 250);
  --primary-foreground: oklch(1 0 0);
  /* ... more tokens ... */
}
\`\`\`

## Security Best Practices

### CORS & Iframe Sandboxing

- Jitsi Meet handles CORS automatically
- The embed uses proper iframe attributes
- JWT tokens enable secure, authenticated access

### Environment Variables

For JWT tokens and API keys:

1. Create a `.env.local` file in the project root:

\`\`\`env
NEXT_PUBLIC_JITSI_DOMAIN=8x8.vc
JITSI_JWT_TOKEN=your_jwt_token_here
\`\`\`

2. Access in components:

\`\`\`typescript
const token = process.env.JITSI_JWT_TOKEN
\`\`\`

**Note**: Only variables prefixed with `NEXT_PUBLIC_` are accessible in the browser.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab
2. Connect to Vercel: [https://vercel.com/new](https://vercel.com/new)
3. Add environment variables in project settings
4. Deploy with one click

### Other Hosting Services

1. Build the project:

\`\`\`bash
npm run build
\`\`\`

2. Deploy the `.next` folder to your hosting service

3. Ensure environment variables are set in your hosting dashboard

### Docker Deployment

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

Build and run:

\`\`\`bash
docker build -t jitsi-integration .
docker run -p 3000:3000 jitsi-integration
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── globals.css          # Global styles & design tokens
│   └── page.tsx             # Main page with state management
├── components/
│   ├── jitsi-embed.tsx      # Jitsi embedding component
│   ├── config-panel.tsx     # Configuration UI
│   └── ui/                  # shadcn UI components
├── public/                  # Static assets
├── next.config.mjs          # Next.js configuration
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
\`\`\`

## API Reference

### JitsiEmbed Component

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `roomName` | string | required | Unique room identifier |
| `userName` | string | required | User display name |
| `userEmail` | string | optional | User email for avatars |
| `startWithVideoMuted` | boolean | false | Initial video state |
| `startWithAudioMuted` | boolean | false | Initial audio state |
| `domain` | string | "8x8.vc" | Jitsi server domain |
| `jwt` | string | optional | JWT token for premium features |
| `onClose` | function | optional | Callback when conference ends |
| `configOverwrite` | object | {} | Custom Jitsi configuration |
| `interfaceConfigOverwrite` | object | {} | Custom UI configuration |

**Events:**

The component automatically handles:
- `videoConferenceJoined` - User joined the call
- `videoConferenceLeft` - User left the call
- `participantJoined` - Another participant joined
- `participantLeft` - Participant left
- `readyToClose` - Conference ended

## Troubleshooting

### Jitsi fails to load

- Check browser console for errors
- Verify `domain` prop points to valid Jitsi server
- Ensure HTTPS is used in production
- Check firewall/proxy settings

### Audio/Video not working

- Verify browser permissions for microphone/camera
- Test in Chrome DevTools - Sensors tab
- Check media constraints in `configOverwrite`

### JWT token not accepted

- Verify token hasn't expired
- Confirm token is from your Jitsi provider
- Check token format (should be a valid JWT)

## Advanced Usage

### Custom Configuration Example

\`\`\`typescript
<JitsiEmbed
  roomName="secure-meeting"
  userName="Admin"
  configOverwrite={{
    startVideoMuted: true,
    enableWelcomePage: false,
    disableInviteFunctions: true,
    p2p: {
      enabled: true,
    },
  }}
  interfaceConfigOverwrite={{
    DISABLE_PRESENCE_STATUS: true,
    TOOLBOX_TIMEOUT: 4000,
  }}
/>
\`\`\`

### Server-Side Room Creation

For production apps, generate room names server-side:

\`\`\`typescript
// api/meeting/create.ts
export async function POST(req: Request) {
  const meetingId = crypto.randomUUID()
  const roomName = `meeting-${meetingId}`
  
  return Response.json({ roomName })
}
\`\`\`

## Performance Optimization

- **Lazy Loading**: Jitsi script loads on-demand
- **Component Reusability**: Single script instance for multiple meetings
- **Cleanup**: Proper dispose() on component unmount
- **Memory Management**: Event listeners auto-removed

## Support & Resources

- [Jitsi Meet Documentation](https://jitsi.org/user-documentation/)
- [Jitsi External API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-jitsi-meet-external-api/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs/concepts/deployments/overview)

## License

MIT License - feel free to use this project for personal and commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

**Built with ❤️ using Next.js, React, and Jitsi Meet**
