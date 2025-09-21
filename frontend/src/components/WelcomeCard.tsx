type WelcomeCardProps = {
  welcomeName: string;
  showImage: boolean;
  imageSrc: string;
};

const WelcomeCard = ({ welcomeName, showImage, imageSrc }: WelcomeCardProps) => (
  <div className="welcome-card">
    <div className="welcome-banner">
      <h2 className="welcome-title">Welcome {welcomeName}!</h2>
      <p className="welcome-text">
        Tweak your preferences in the settings modal and start a conversation when you&apos;re ready.
      </p>
    </div>
    {showImage && (
      <div className="welcome-media">
        <img src={imageSrc} alt="GoopUI mascot" className="welcome-image" />
      </div>
    )}
  </div>
);

export default WelcomeCard;
