import React, { useEffect, useRef } from "react";

const MouseParticleTrail = () => {
    const canvasRef = useRef(null);
    let lastParticleTime = Date.now();
    const particleInterval = 70;

    const getColoredSVGDataUrl = (color) => {
        const svg = `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.0909 11.9629L19.3636 8.63087V14.1707C18.8126 13.8538 18.1574 13.67 17.4545 13.67C15.4964 13.67 13.9091 15.096 13.9091 16.855C13.9091 18.614 15.4964 20.04 17.4545 20.04C19.4126 20.04 21 18.614 21 16.855C21 16.855 21 16.8551 21 16.855L21 7.49236C21 6.37238 21 5.4331 20.9123 4.68472C20.8999 4.57895 20.8852 4.4738 20.869 4.37569C20.7845 3.86441 20.6352 3.38745 20.347 2.98917C20.2028 2.79002 20.024 2.61055 19.8012 2.45628C19.7594 2.42736 19.716 2.39932 19.6711 2.3722L19.6621 2.36679C18.8906 1.90553 18.0233 1.93852 17.1298 2.14305C16.2657 2.34086 15.1944 2.74368 13.8808 3.23763L11.5963 4.09656C10.9806 4.32806 10.4589 4.52419 10.0494 4.72734C9.61376 4.94348 9.23849 5.1984 8.95707 5.57828C8.67564 5.95817 8.55876 6.36756 8.50501 6.81203C8.4545 7.22978 8.45452 7.7378 8.45455 8.33743V16.1307C7.90347 15.8138 7.24835 15.63 6.54545 15.63C4.58735 15.63 3 17.056 3 18.815C3 20.574 4.58735 22 6.54545 22C8.50355 22 10.0909 20.574 10.0909 18.815C10.0909 18.815 10.0909 18.8151 10.0909 18.815L10.0909 11.9629Z" fill="#${color}"/></svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let particles = [];
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);

        function getRandomColorHSL() {
            return 360 * Math.random()
        }

        function hslToHex(h, s, l) {
            l /= 100;
            const a = s * Math.min(l, 1 - l) / 100;
            const f = n => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
            };
            return `${f(0)}${f(8)}${f(4)}`;
        }

        const createParticle = (x, y) => {
            const size = 30; // Можно менять размер ноты
            const hsl = getRandomColorHSL()
            const color = hslToHex(hsl, 100, 50)
            const speedX = Math.random() * 2 - 1;
            const speedY = Math.random() * 2 - 1;
            const image = new Image();
            image.src = getColoredSVGDataUrl(color);

            return {x, y, size, speedX, speedY, image};
        };

        const animate = () => {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((particle, index) => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                particle.size -= 0.1;
                if (particle.size <= 10) {
                    particles.splice(index, 1);
                }
                // Отрисовка SVG-изображения
                ctx.drawImage(particle.image, particle.x - 15, particle.y - 15, particle.size, particle.size);
            });
        };

        animate();
        const handleMouseMove = (event) => {
            const now = Date.now();
            if (now - lastParticleTime > particleInterval) {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                particles.push(createParticle(x, y));
                lastParticleTime = now;
            }
        };

        canvas.addEventListener("mousemove", handleMouseMove);

        return () => {
            canvas.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return <canvas ref={canvasRef} style={{position: "fixed", top: 70, left: 0, width: "100%", height: "calc(100vh - 90px)"}}/>;
};

export default MouseParticleTrail;
