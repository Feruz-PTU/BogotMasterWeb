import { useState } from 'react'
import Navbar from './components/Navbar';
import Partners from './components/Partners';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import About from './components/About';
import Certificates from './components/Certificates';
import FeaturedGallery from './components/FeaturedGallery';
import Contact from './components/Contact';
import SEO from './components/SEO';
import { ToastContainer, useToast } from './components/Toast';

function App() {
    const { toasts, addToast, removeToast } = useToast();

    return (
        <div className="app">
            <SEO />
            <Navbar />
            <Hero />
            <Gallery />

            <About />
            <Certificates />
            <Partners />
            <FeaturedGallery />

            <Contact />

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    )
}

export default App
