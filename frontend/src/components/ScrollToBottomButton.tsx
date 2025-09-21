type ScrollToBottomButtonProps = {
  onClick: () => void;
};

const ScrollToBottomButton = ({ onClick }: ScrollToBottomButtonProps) => (
  <button type="button" className="scroll-button" onClick={onClick}>
    ↓ Latest
  </button>
);

export default ScrollToBottomButton;
