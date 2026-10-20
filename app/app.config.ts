export default defineAppConfig({
  site: {
    name: 'Fuckery Detected',
    avatar: '/avatar.webp',
    about: 'Writing about engineering, politics and whatever else is broken. Developer, Husband/Father, Comedian, Musician and rotisserie chicken splurger and enthusiast. Enjoys long romantic walks to the liquor store...\n' +
        '\n' +
        'stop looking at my profile...it makes me feel dirty...',
    recentCount: 3,
    privacy: 'No ads, no tracking cookies and no profiling. Visits are counted with a privacy-focused tool that stores no personal data. Comments need a sign-in, and I keep only your display name and email for that. Passwords are never stored by this site.',
    thanks: {
      text: 'Thanks for reading. If something here made you laugh, think or swear, you can say thanks with a whiskey.',
      tipUrl: ''
    },
    social: [
      { platform: 'github', label: 'GitHub', url: 'https://github.com/madmonkey' },
      { platform: 'bluesky', label: 'Bluesky', url: 'https://bsky.app/profile/adelpreore.bsky.social' }
    ]
  }
})
