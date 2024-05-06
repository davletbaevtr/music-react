import React, { useEffect, useRef } from "react";

const MouseParticleTrail = () => {
    const canvasRef = useRef(null);
    let lastParticleTime = Date.now();
    const particleInterval = 70;

    const getColoredSVGDataUrl = (color) => {
        const svg1 = `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.0909 11.9629L19.3636 8.63087V14.1707C18.8126 13.8538 18.1574 13.67 17.4545 13.67C15.4964 13.67 13.9091 15.096 13.9091 16.855C13.9091 18.614 15.4964 20.04 17.4545 20.04C19.4126 20.04 21 18.614 21 16.855C21 16.855 21 16.8551 21 16.855L21 7.49236C21 6.37238 21 5.4331 20.9123 4.68472C20.8999 4.57895 20.8852 4.4738 20.869 4.37569C20.7845 3.86441 20.6352 3.38745 20.347 2.98917C20.2028 2.79002 20.024 2.61055 19.8012 2.45628C19.7594 2.42736 19.716 2.39932 19.6711 2.3722L19.6621 2.36679C18.8906 1.90553 18.0233 1.93852 17.1298 2.14305C16.2657 2.34086 15.1944 2.74368 13.8808 3.23763L11.5963 4.09656C10.9806 4.32806 10.4589 4.52419 10.0494 4.72734C9.61376 4.94348 9.23849 5.1984 8.95707 5.57828C8.67564 5.95817 8.55876 6.36756 8.50501 6.81203C8.4545 7.22978 8.45452 7.7378 8.45455 8.33743V16.1307C7.90347 15.8138 7.24835 15.63 6.54545 15.63C4.58735 15.63 3 17.056 3 18.815C3 20.574 4.58735 22 6.54545 22C8.50355 22 10.0909 20.574 10.0909 18.815C10.0909 18.815 10.0909 18.8151 10.0909 18.815L10.0909 11.9629Z" fill="#${color}"/></svg>`;
        const svg2 = `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.3187 2.50498C13.0514 2.35716 11.8489 3.10033 11.4144 4.29989C11.3165 4.57023 11.2821 4.86251 11.266 5.16888C11.2539 5.40001 11.2509 5.67552 11.2503 6L11.25 6.45499C11.25 6.4598 11.25 6.4646 11.25 6.46938V14.5359C10.4003 13.7384 9.25721 13.25 8 13.25C5.37665 13.25 3.25 15.3766 3.25 18C3.25 20.6234 5.37665 22.75 8 22.75C10.6234 22.75 12.75 20.6234 12.75 18V9.21059C12.8548 9.26646 12.9683 9.32316 13.0927 9.38527L15.8002 10.739C16.2185 10.9481 16.5589 11.1183 16.8378 11.2399C17.119 11.3625 17.3958 11.4625 17.6814 11.4958C18.9486 11.6436 20.1511 10.9004 20.5856 9.70089C20.6836 9.43055 20.7179 9.13826 20.7341 8.83189C20.75 8.52806 20.75 8.14752 20.75 7.67988L20.7501 7.59705C20.7502 7.2493 20.7503 6.97726 20.701 6.71946C20.574 6.05585 20.2071 5.46223 19.6704 5.05185C19.4618 4.89242 19.2185 4.77088 18.9074 4.6155L16.1999 3.26179C15.7816 3.05264 15.4412 2.88244 15.1623 2.76086C14.8811 2.63826 14.6043 2.53829 14.3187 2.50498Z" fill="#${color}"/></svg>`
        if (Math.random() > 0.5) {
            return `data:image/svg+xml;base64,${btoa(svg1)}`;
        }
        return `data:image/svg+xml;base64,${btoa(svg2)}`;
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
