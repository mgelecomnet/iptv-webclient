import './Loading.css';

interface LoadingProps {
  message?: string;
}

const Loading = ({ message = 'در حال بارگذاری...' }: LoadingProps) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default Loading;