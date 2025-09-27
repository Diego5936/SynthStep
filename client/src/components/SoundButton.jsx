export default function SoundButton({ label, onClick }) {
    return (
        <button 
            onClick={onClick}
            style={{ margin: "10px", padding: "10px 20px", fontSize: "16px" }}
        >
            {label}
        </button>
    );
}