export default function fetchWrapper(url: string) {
    return fetch(url, {
        headers: {
            "ngrok-skip-browser-warning": "69420"
        }
    });
}
