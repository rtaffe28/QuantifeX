import React, { useEffect, useRef } from "react";
import { Box, Text, Flex } from "@chakra-ui/react";

const PARTICLE_COUNT = 60;
const COLORS = ["#3182CE", "#63B3ED", "#90CDF4", "#38B2AC", "#4FD1C5"];

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
}

function initParticles(w: number, h: number): Particle[] {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
}

export const LandingHero: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let particles: Particle[];

        const resize = () => {
            canvas.width = canvas.offsetWidth * devicePixelRatio;
            canvas.height = canvas.offsetHeight * devicePixelRatio;
            ctx.scale(devicePixelRatio, devicePixelRatio);
            particles = initParticles(canvas.offsetWidth, canvas.offsetHeight);
        };

        resize();
        window.addEventListener("resize", resize);

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        canvas.addEventListener("mousemove", handleMouseMove);

        const draw = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            ctx.clearRect(0, 0, w, h);

            const mouse = mouseRef.current;

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                // mouse repulsion
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    const force = (120 - dist) / 120;
                    p.vx += (dx / dist) * force * 0.3;
                    p.vy += (dy / dist) * force * 0.3;
                }

                // dampen velocity
                p.vx *= 0.99;
                p.vy *= 0.99;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }

            // draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(99, 179, 237, ${0.15 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
            canvas.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <Flex
            position="relative"
            align="center"
            justify="center"
            h="100%"
            w="100%"
            overflow="hidden"
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            />
            <Box position="relative" textAlign="center" zIndex={1}>
                <Text
                    fontSize={{ base: "5xl", md: "7xl", lg: "8xl" }}
                    fontWeight="bold"
                    bgGradient="to-r"
                    gradientFrom="blue.400"
                    gradientTo="teal.300"
                    bgClip="text"
                    letterSpacing="tight"
                    lineHeight="1"
                    style={{
                        animation: "fadeInUp 1s ease-out",
                    }}
                >
                    QuantifeX
                </Text>
                <Text
                    fontSize={{ base: "md", md: "lg" }}
                    color="fg.muted"
                    mt={4}
                    style={{
                        animation: "fadeInUp 1s ease-out 0.3s both",
                    }}
                >
                    Track. Analyze. Quantify your edge.
                </Text>
            </Box>
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </Flex>
    );
};
