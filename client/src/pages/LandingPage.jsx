import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import CoreLoop from '../components/landing/CoreLoop';
import MatchingAlgo from '../components/landing/MatchingAlgo';
import CommunityFeed from '../components/landing/CommunityFeed';
import EloSystem from '../components/landing/EloSystem';
import CallToAction from '../components/landing/CallToAction';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <CoreLoop />
      <MatchingAlgo />
      <CommunityFeed />
      <EloSystem />
      <CallToAction />
      <Footer />
    </>
  );
}
