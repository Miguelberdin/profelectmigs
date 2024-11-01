export default function ApplicationLogo(props) {
    return (
        <img
            {...props}
            src="/logo/logo.png"
            alt="Chirp Logo"
            width="150"
            height="150"
            style={{ maxWidth: '100%', height: '70px' }}
        />
    );
}
