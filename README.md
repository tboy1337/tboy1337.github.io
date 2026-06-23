# tboy1337 GitHub Pages Portfolio

This repository contains the source code for my personal portfolio website, hosted on GitHub Pages at [https://tboy1337.github.io](https://tboy1337.github.io).

## 🌟 Overview

A comprehensive, interactive portfolio website showcasing my software development projects, skills, and expertise. The site features a modern glassmorphism design with gradient backgrounds, interactive games, and responsive layouts that work seamlessly across all devices.

## ✨ Features

### Core Portfolio Features
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices
- **Project Showcase**: Comprehensive collection of my GitHub repositories with detailed descriptions
- **Interactive Contact Form**: Fully functional contact form with validation and Formspree integration
- **GitHub Achievements**: Visual display of GitHub accomplishments and badges
- **Multi-language Support**: Real-time translation via Google Translate integration
- **Service Worker**: Offline functionality and improved performance
- **Modern UI**: Glassmorphism effects, smooth animations, and gradient backgrounds

### Interactive Games Section
The site includes four fully-featured browser games:

1. **Memory Card Game**: Match pairs of tech-themed icons within a time limit
2. **Snake Game**: Classic snake game with responsive canvas and touch controls
3. **Typing Speed Test**: Measure your WPM and accuracy with various text prompts
4. **Advanced Music Studio**: Full chromatic keyboard with multi-layer recording, effects, and looping

### Advanced Functionality
- **Form Validation**: Real-time client-side validation with user-friendly error messages
- **Service Worker**: Offline caching with network-first HTML and script updates
- **Accessibility**: ARIA labels, keyboard navigation, skip link, and screen reader support
- **Lazy Loading**: Games bundle loads when the games section is near the viewport

## 🛠️ Technologies Used

### Frontend Technologies
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with custom properties and responsive design
- **Tailwind CSS**: Built static CSS (`tailwind.css`) generated from utility classes in `index.html` and `games.js`
- **Vanilla JavaScript**: No frameworks, pure JavaScript for optimal performance

### APIs & Services
- **Formspree**: Contact form backend service
- **Google Translate API**: Multi-language translation support
- **Web Audio API**: Real-time audio synthesis for music games
- **Font Awesome 6**: Icon library for UI elements

### Development Tools
- **Service Worker**: Caching and offline functionality
- **Progressive Web App**: Manifest file for app-like experience
- **Canvas API**: 2D graphics for Snake game

## 🚀 Featured Projects

The portfolio showcases the following key projects:

### Networking & Proxy Tools
- **[MultiSocks](https://github.com/tboy1337/multisocks)**: SOCKS proxy aggregator for bandwidth optimization
- **[Dispatch-py](https://github.com/tboy1337/dispatch-py)**: Traffic balancing SOCKS proxy for network optimization
- **[Scrapeer-py](https://github.com/tboy1337/scrapeer-py)**: Library for scraping HTTP(S) and UDP trackers for torrent information

### Multimedia & Content Tools
- **[SubtitleTools](https://github.com/tboy1337/SubtitleTools)**: A tool for subtitle processing workflows, including extraction, conversion and optimization
- **[MediaRelay](https://github.com/tboy1337/MediaRelay)**: Video streaming server for securely sharing personal video library over the internet
- **[DAV2MKV](https://github.com/tboy1337/dav2mkv)**: Versatile tool for converting DAV video files to MKV or MP4 while maintaining perfect quality

### Communication Tools
- **[FreeSMS](https://github.com/tboy1337/FreeSMS)**: Cross-platform Python application with PySide GUI for sending free SMS messages worldwide

### System & Utility Tools
- **[WindowsRescue](https://github.com/tboy1337/WindowsRescue)**: Collection of batch scripts to repair, maintain, optimize and update Windows systems
- **[Git Manager Windows](https://github.com/tboy1337/Git-Manager-Windows)**: Batch scripts to automate Git management on Windows systems
- **[TgCrypto2](https://github.com/tboy1337/tgcrypto2)**: Enhanced TgCrypto fork with working wheels for Python 3.9-3.13

### Development Tools
- **[Blinter](https://github.com/tboy1337/Blinter)**: Blinter is a linter for Windows batch files. It provides comprehensive static analysis to identify syntax errors, security vulnerabilities, performance issues and style problems

### Analytics & Business
- **[ProfitPioneer](https://github.com/tboy1337/ProfitPioneer)**: Comprehensive e-commerce analytics dashboard built with Streamlit for business intelligence insights


### Fun Projects
- **[ClockClock24-py](https://github.com/tboy1337/ClockClock24-py)**: Python port of the ClockClock project - creative clock display made of analog clocks

### Cryptocurrency Tools
- **[Cryptocurrency Wallet Generators Organization](https://github.com/Cryptocurrency-Wallet-Generators)**: Collection of open-source tools for generating wallets for various cryptocurrencies

### Legal & Documentation
- **[Commercial Restricted License](https://github.com/tboy1337/Commercial-Restricted-License)**: Software license designed to bridge the gap between fully open and fully proprietary software

## 📁 Project Structure

```
tboy1337.github.io/
├── index.html              # Main portfolio webpage
├── tailwind.css            # Built Tailwind CSS (run npm run build)
├── src/tailwind.css        # Tailwind source file
├── src/games.css           # Game styles source file
├── games.css               # Built game styles (run npm run build)
├── games.js                # Game logic and functionality
├── translation.js          # Google Translate integration
├── site-sw-register.js     # Service worker registration
├── contact-form.js         # Contact form handler
├── sw.js                   # Service worker for offline functionality
├── lib/                    # Shared ES modules
│   ├── bootstrap-site-utils.mjs
│   ├── contact-validation.mjs
│   ├── game-utils.mjs
│   ├── lazy-games-loader.mjs
│   ├── memory-game-utils.mjs
│   ├── music-studio-audio.mjs
│   ├── nav-hashes.mjs
│   ├── on-dom-ready.mjs
│   ├── snake-logic.mjs
│   ├── sw-utils.mjs
│   └── typing-stats.mjs
├── tests/                  # Vitest unit tests and Playwright e2e tests
├── scripts/                # Coverage merge and tooling scripts
├── site.webmanifest        # Progressive web app manifest
├── robots.txt              # Search engine crawling instructions
├── sitemap.xml             # Site structure for SEO
├── LICENSE.txt             # MIT license
├── README.md               # Project documentation
├── favicon.ico             # Website favicon
├── favicon-16x16.png       # 16x16 favicon
├── favicon-32x32.png       # 32x32 favicon
├── apple-touch-icon.png    # iOS app icon
├── android-chrome-192x192.png  # Android app icon (192x192)
├── android-chrome-512x512.png  # Android app icon (512x512)
├── quickdraw-default.png   # GitHub achievement badge
├── pull-shark-default.png  # GitHub achievement badge
├── pair-extraordinaire-default.png  # GitHub achievement badge
├── yolo-default.png        # GitHub achievement badge
└── starstruck-default.png  # GitHub achievement badge
```

## 🎮 Interactive Games

### Memory Card Game
- **Tech Stack**: Vanilla JavaScript, CSS animations
- **Features**: Timer-based gameplay, score tracking, responsive grid layout
- **Icons**: Tech-themed icons from Font Awesome

### Snake Game
- **Tech Stack**: HTML5 Canvas API, JavaScript
- **Features**: Responsive canvas, touch controls for mobile, collision detection
- **Controls**: Arrow keys (desktop) or touch buttons (mobile)

### Typing Speed Test
- **Features**: Real-time WPM calculation, accuracy tracking, multiple text prompts
- **Metrics**: Words per minute, accuracy percentage, time tracking

### Advanced Music Studio
- **Tech Stack**: Web Audio API, JavaScript
- **Features**: Chromatic piano keyboard, multi-layer recording (up to 4 layers), per-layer tempo control, save/load compositions
- **Effects**: Reverb, delay, chorus, distortion, and filter with real-time mixing
- **Instruments**: Synthesizer, piano, strings, and bass
- **Controls**: On-screen keyboard legend (desktop); touch piano on mobile

## 📱 Responsive Design

The website is fully responsive and includes:
- **Mobile-first approach**: Optimized for touch interfaces
- **Flexible layouts**: CSS Grid and Flexbox for adaptive designs
- **Touch controls**: Mobile-friendly game interactions
- **Viewport optimization**: Proper scaling across all device sizes

## 🌐 Deployment

The website is automatically deployed through GitHub Pages:
- **Source**: Main branch of this repository
- **URL**: [https://tboy1337.github.io](https://tboy1337.github.io)
- **Updates**: Automatic deployment on every push to main branch
- **CDN**: Global content delivery via GitHub's infrastructure
- **Security headers**: GitHub Pages does not support custom HTTP headers (CSP, HSTS). The site uses a best-effort meta Content-Security-Policy; full header-based CSP/HSTS requires a reverse proxy such as Cloudflare.

## 🗣️ Multi-language Support

The website includes comprehensive translation features:
- **Google Translate Integration**: Dropdown selector in the header (third-party script; page content is sent to Google for translation)
- **Supported Languages**: 100+ languages via Google Translate
- **Dynamic Content**: Real-time translation of all page content
- **Preserved Styling**: Translations maintain the site's visual design

## 📧 Contact Form

Fully functional contact system with:
- **Backend**: Formspree integration for message handling
- **Validation**: Real-time client-side and server-side validation
- **Security**: Protected against spam and malicious submissions
- **User Experience**: Success/error feedback with smooth animations

## 🏆 GitHub Achievements

Visual showcase of GitHub accomplishments including:
- **Quickdraw**: Fast repository creation and initial commits
- **Pull Shark**: Merged pull request contributions
- **Pair Extraordinaire**: Collaborative development achievements
- **YOLO**: Direct-to-main branch contributions
- **Starstruck**: Created a repository with many stars

## ⚡ Performance Features

- **Service Worker**: Offline caching and improved loading times
- **Built CSS**: Tailwind utilities compiled to a static `tailwind.css` file (no runtime CDN)
- **Lazy Loading**: Games and utilities load when the games section is near the viewport
- **Optimized Assets**: Minified CSS (`tailwind.css`, `games.css`), compressed images, and deferred scripts

## 🔧 Development

Install dependencies and run quality checks:

```bash
npm install
npm run build
npm run check
```

### Pre-deploy checklist

Before pushing to `main` (which auto-deploys to GitHub Pages):

```bash
npm run build && npm run check
```

### Local development

ES modules, the contact form, and the service worker require HTTP. Opening `index.html` via `file://` will not work.

```bash
# Recommended: Vite dev server (same port used by Playwright tests)
npx vite --port 4173

# Alternatives
npx serve .
python -m http.server 8000
```

Then open `http://localhost:4173` (or the port your server prints).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## 🤝 Contributing

While this is a personal portfolio, you're welcome to:
- Report bugs or issues
- Suggest improvements or new features
- Fork the project for your own portfolio inspiration

## 📞 Contact

- **Website**: [https://tboy1337.github.io](https://tboy1337.github.io)
- **GitHub**: [@tboy1337](https://github.com/tboy1337)
- **Contact Form**: Available on the website

---

💡 **Built with passion for innovation and powered by curiosity!** 🚀