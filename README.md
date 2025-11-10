# 🚀 React Pages Template

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-brightgreen?style=for-the-badge&logo=github&logoColor=white)](https://basemodmaker.github.io/React-Pages-Template/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

> A clean, modern React template with GitHub Pages deployment ready to go! Perfect for quickly spinning up React projects with automated deployment.

## ✨ Features

- 🎯 **React 19** - Latest React with modern features
- 🚀 **GitHub Pages Ready** - Automated deployment with gh-pages
- 🧪 **Testing Suite** - Pre-configured Jest and React Testing Library
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Fast Development** - Hot reload and instant feedback
- 🔧 **Zero Configuration** - Works out of the box
- 📦 **Optimized Build** - Production-ready bundling

## 🎯 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. **Use this template** or clone the repository:
   ```bash
   git clone https://github.com/BaseModMaker/React-Pages-Template.git
   cd React-Pages-Template
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## 🚀 Deployment

This template is configured for seamless GitHub Pages deployment:

1. **Build and deploy:**
   ```bash
   npm run deploy
   ```

2. **That's it!** Your app will be live at `https://yourusername.github.io/your-repo-name`

### Deployment Configuration

- Update the `homepage` field in `package.json` to match your GitHub Pages URL
- Push to your main branch
- Run `npm run deploy` to build and deploy to the `gh-pages` branch

## 📁 Project Structure

```
React-Pages-Template/
├── public/                 # Static assets
│   ├── index.html         # HTML template
│   ├── favicon.ico        # Favicon
│   └── manifest.json      # PWA manifest
├── src/                   # Source code
│   ├── App.js            # Main App component
│   ├── App.css           # App styles
│   ├── index.js          # Entry point
│   └── index.css         # Global styles
├── build/                # Production build (generated)
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Starts development server on port 3000 |
| `npm run build` | Creates optimized production build |
| `npm test` | Runs test suite in watch mode |
| `npm run deploy` | Builds and deploys to GitHub Pages |
| `npm run eject` | Ejects from Create React App (irreversible) |

## 🎨 Customization

### Updating the Homepage URL

1. Open `package.json`
2. Update the `homepage` field:
   ```json
   {
     "homepage": "https://yourusername.github.io/your-repo-name"
   }
   ```

### Adding Your Content

1. Edit `src/App.js` to customize your main component
2. Modify `src/App.css` for styling
3. Update `public/index.html` for meta tags and title
4. Replace `public/favicon.ico` with your own favicon

## 🧪 Testing

Run the test suite:
```bash
npm test
```

The template includes:
- Jest for unit testing
- React Testing Library for component testing
- Example test in `src/App.test.js`

## 📦 Built With

- **React 19.1.1** - UI Library
- **Create React App** - Build toolchain
- **GitHub Pages** - Hosting platform
- **Jest** - Testing framework
- **React Testing Library** - Testing utilities

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Created with [Create React App](https://github.com/facebook/create-react-app)
- Deployed with [gh-pages](https://github.com/tschaub/gh-pages)
- Icons from [React Icons](https://react-icons.github.io/react-icons/)

---

<div align="center">
  <p>⭐ Star this repo if you found it helpful!</p>
  <p>Made with ❤️ by <a href="https://github.com/BaseModMaker">BaseModMaker</a></p>
</div>