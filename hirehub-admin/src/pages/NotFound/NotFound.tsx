
import { useNavigate } from 'react-router-dom';
import errorBg from '../../assets/images/404.svg';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#D1F3C4] p-4 font-sans">
            {/* Main Card Container */}
            <div className="bg-white rounded-3xl shadow-sm border border-[#52C3FF] w-full max-w-[760px] p-8 md:p-12 flex flex-col items-center">
                <div className="relative w-full max-w-[500px] mb-8">
                    <img 
                        src={errorBg} 
                        alt="404 Background" 
                        className="w-full h-auto block"
                    />
                    
                    {/* Overlaying the 404 Text and elements on the image */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                        <h1 className="text-[#FF9F2D] text-7xl md:text-9xl font-bold tracking-tighter leading-none">
                            404
                        </h1>
                        <div className="absolute top-2 left-4 flex space-x-1.5 opacity-80">
                            <div className="w-2.5 h-2.5 bg-[#FF5F57] rounded-full"></div>
                            <div className="w-2.5 h-2.5 bg-[#FFBC2E] rounded-full"></div>
                            <div className="w-2.5 h-2.5 bg-[#28C840] rounded-full"></div>
                        </div>

                        <div className="absolute bottom-6 left-6 space-y-2 opacity-60">
                            <div className="w-8 h-2 bg-white rounded-full"></div>
                            <div className="w-12 h-2 bg-white rounded-full"></div>
                        </div>

                        <div className="absolute bottom-6 right-6 flex space-x-1 opacity-60">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>

                <h2 className="text-[#4D4D4D] text-lg md:text-xl font-medium mb-10">
                    Looks like you’ve got lost....
                </h2>

                <button 
                    onClick={() => navigate('/')}
                    className="bg-[#44B12C] hover:bg-[#3a9625] text-white font-semibold py-3.5 px-14 rounded-xl transition-all duration-300 shadow-md active:scale-95"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default NotFound;