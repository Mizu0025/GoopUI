type WelcomeCardProps = {
  welcomeName: string;
  showImage: boolean;
  imageSrc: string;
};

const WelcomeCard = ({ welcomeName, showImage, imageSrc }: WelcomeCardProps) => (
  <div className="welcome-card">
    <h2 className="welcome-title">Welcome {welcomeName}!</h2>
    {showImage && (
      <div className="chat-context">
        <img src={imageSrc} alt="GoopUI mascot" className="welcome-image" />
      </div>
    )}
  </div>
);

export default WelcomeCard;
