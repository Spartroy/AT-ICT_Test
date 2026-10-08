import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../../components/Seo';
import SiteLayout from './SiteLayout';

const PageHero = ({ eyebrow, title, lead }) => (
  <section className="page-hero dark">
    <div className="wrap center">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="h2">{title}</h1>
      {lead && <p className="lead">{lead}</p>}
    </div>
  </section>
);

const Mail = () => <a href="mailto:at.ictofficial@gmail.com">at.ictofficial@gmail.com</a>;

export function Privacy() {
  return (
    <SiteLayout>
      <Seo title="Privacy Policy" description="How AT-ICT collects, uses, and protects student and parent data." path="/privacy" />
      <PageHero eyebrow="Legal" title={<>Privacy <em>policy.</em></>} />
      <div className="wrap prose">
        <p>AT-ICT respects your privacy. We collect only the information needed to provide learning services, communicate with students and parents, and improve the platform experience.</p>
        <h2>What we collect</h2>
        <p>Account details, contact information, course activity, and limited technical data required for security and session management.</p>
        <h2>How we use data</h2>
        <p>Data is used to deliver classes, track progress, support communication, and maintain secure access to the platform.</p>
        <h2>Contact</h2>
        <p>For privacy requests, email <Mail />.</p>
      </div>
    </SiteLayout>
  );
}

export function Terms() {
  return (
    <SiteLayout>
      <Seo title="Terms of Service" description="The terms for using the AT-ICT learning platform." path="/terms" />
      <PageHero eyebrow="Legal" title={<>Terms of <em>service.</em></>} />
      <div className="wrap prose">
        <p>By using AT-ICT, you agree to use the platform for educational purposes and comply with classroom and community rules.</p>
        <h2>Accounts &amp; access</h2>
        <p>Users are responsible for keeping their credentials secure and for activity under their account.</p>
        <h2>Content &amp; conduct</h2>
        <p>Course content is provided for enrolled students only and may not be redistributed without permission.</p>
        <h2>Support</h2>
        <p>Questions about these terms can be sent to <Mail />.</p>
      </div>
    </SiteLayout>
  );
}

export function NotFound() {
  return (
    <SiteLayout>
      <Seo title="Page Not Found" description="The page you're looking for doesn't exist." path="/404" noIndex />
      <section className="page-hero dark" style={{ minHeight: '80svh', display: 'grid', placeItems: 'center' }}>
        <div className="wrap center">
          <span className="eyebrow">404</span>
          <h1 className="h2">Page <em>not found.</em></h1>
          <p className="lead">The page you're looking for doesn't exist or has been moved.</p>
          <div className="ctas" style={{ justifyContent: 'center', marginTop: 24 }}>
            <Link className="btn btn-p" to="/">Go home</Link>
            <Link className="btn btn-o" to="/#samples">Free samples</Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
