'use client';

import { useRef, useEffect, useState } from 'react';
import type * as Matter from 'matter-js';

const AngryBirdsGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const currentBirdRef = useRef<Matter.Body | null>(null);
  const slingshotConstraintRef = useRef<Matter.Constraint | null>(null);
  
  const [gameState, setGameState] = useState({
    score: 0,
    birdsLeft: 3,
    gameStatus: 'playing' as 'playing' | 'won' | 'lost'
  });
  
  // 게임 초기화
  useEffect(() => {
    const initGame = async () => {
      // Matter.js 동적 로드
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Matter = (await import('matter-js')).default as any;
      
      if (!canvasRef.current) return;
      
      // 🚀 극한 탄성력: 초강력 물리 엔진
      const engine = Matter.Engine.create();
      engine.world.gravity.y = 0.3; // 중력 더욱 감소 (멀리 날아감)
      engine.timing.timeScale = 1.0;
      engine.positionIterations = 10; // 위치 정확도 최대
      engine.velocityIterations = 8; // 속도 정확도 최대
      engineRef.current = engine;
      
      // 렌더러 생성
      const render = Matter.Render.create({
        canvas: canvasRef.current,
        engine: engine,
        options: {
          width: 1000,
          height: 600,
          wireframes: false,
          background: 'transparent',
          showAngleIndicator: false,
          showVelocity: false,
        }
      });
      renderRef.current = render;
      
      // 바닥 생성 (아래쪽에 배치)
      const ground = Matter.Bodies.rectangle(500, 575, 1000, 50, {
        isStatic: true,
        render: {
          fillStyle: '#8B4513'
        }
      });
      
      // 새총 기둥 생성
      const slingshotPole = Matter.Bodies.rectangle(150, 480, 20, 160, {
        isStatic: true,
        render: {
          fillStyle: '#654321'
        }
      });
      
      // 🏗️ 문제 2 해결: 완전 안정적인 구조물 배치
      // 돼지들 생성 (바닥에 완전히 안착)
      const pig1 = Matter.Bodies.circle(700, 540, 16, {
        render: { fillStyle: '#90EE90' },
        label: 'pig',
        density: 0.3,
        friction: 1.5,
        frictionStatic: 2.0,
        restitution: 0.1
      });
      
      const pig2 = Matter.Bodies.circle(800, 540, 16, {
        render: { fillStyle: '#90EE90' },
        label: 'pig',
        density: 0.3,
        friction: 1.5,
        frictionStatic: 2.0,
        restitution: 0.1
      });
      
      const pig3 = Matter.Bodies.circle(750, 540, 16, {
        render: { fillStyle: '#90EE90' },
        label: 'pig',
        density: 0.3,
        friction: 1.5,
        frictionStatic: 2.0,
        restitution: 0.1
      });
      
      // 완전 안정적인 나무 블록들 (더 넓고 낮게)
      const blocks = [];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
          blocks.push(
            Matter.Bodies.rectangle(
              670 + i * 50,
              530 - j * 35,
              25,
              35,
              {
                render: { fillStyle: '#8B4513' },
                label: 'block',
                density: 0.8,
                friction: 1.5,
                frictionStatic: 3.0,
                restitution: 0.1
              }
            )
          );
        }
      }
      
      // 🚀 극한 탄성력: 초강력 새
      const bird = Matter.Bodies.circle(150, 400, 16, {
        render: { fillStyle: '#FF4444' },
        label: 'bird',
        density: 0.05, // 극한 밀도!
        frictionAir: 0.001, // 공기 저항 극소
        restitution: 0.95, // 최대 튕김력
        inertia: Infinity // 회전 관성 무한대 (관통력 증가)
      });
      currentBirdRef.current = bird;
      
      // 새총 제약 조건 생성 (새를 새총에 연결)
      const slingshotConstraint = Matter.Constraint.create({
        bodyA: slingshotPole,
        bodyB: bird,
        pointA: { x: 0, y: -80 },
        pointB: { x: 0, y: 0 },
        stiffness: 0.05,
        damping: 0.1,
        length: 20
      });
      slingshotConstraintRef.current = slingshotConstraint;
      

      
      // 모든 오브젝트를 월드에 추가
      Matter.World.add(engine.world, [
        ground,
        slingshotPole,
        bird,
        pig1,
        pig2,
        pig3,
        ...blocks,
        slingshotConstraint
      ]);
      
      // 🔥 문제 4 해결: 개선된 충돌 감지 및 점수 시스템
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Matter.Events.on(engine, 'collisionStart', (event: any) => {
        const pairs = event.pairs;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pairs.forEach((pair: any) => {
          const { bodyA, bodyB } = pair;
          
          // 새가 돼지에 충돌
          if ((bodyA.label === 'bird' && bodyB.label === 'pig') ||
              (bodyA.label === 'pig' && bodyB.label === 'bird')) {
            const pig = bodyA.label === 'pig' ? bodyA : bodyB;
            const bird = bodyA.label === 'bird' ? bodyA : bodyB;
            
            // 충돌 강도 계산 (속도가 빠를수록 더 많은 점수)
            const velocity = Math.sqrt(bird.velocity.x ** 2 + bird.velocity.y ** 2);
            const baseScore = 500;
            const velocityBonus = Math.floor(velocity * 10);
            const totalScore = baseScore + velocityBonus;
            
            console.log(`🎯 돼지 맞춤! 속도: ${velocity.toFixed(2)}, 점수: ${totalScore}`);
            
            // 돼지 제거
            Matter.World.remove(engine.world, pig);
            
            // 점수 추가
            setGameState(prev => ({
              ...prev,
              score: prev.score + totalScore
            }));
          }
          
          // 💥 문제 3 해결: 강화된 파괴력 시스템
          if ((bodyA.label === 'bird' && bodyB.label === 'block') ||
              (bodyA.label === 'block' && bodyB.label === 'bird')) {
            const bird = bodyA.label === 'bird' ? bodyA : bodyB;
            const block = bodyA.label === 'block' ? bodyA : bodyB;
            
            // 충돌 강도 계산
            const velocity = Math.sqrt(bird.velocity.x ** 2 + bird.velocity.y ** 2);
            
            // 🚀 강화된 파괴력: 새가 밀고 나가는 효과
            if (velocity > 3) {
              // 임펄스를 블록에 적용 (밀고 나가는 효과)
              const impulseScale = velocity * 0.02;
              const normalX = (block.position.x - bird.position.x) / Math.sqrt((block.position.x - bird.position.x) ** 2 + (block.position.y - bird.position.y) ** 2);
              const normalY = (block.position.y - bird.position.y) / Math.sqrt((block.position.x - bird.position.x) ** 2 + (block.position.y - bird.position.y) ** 2);
              
              Matter.Body.applyForce(block, block.position, {
                x: normalX * impulseScale,
                y: normalY * impulseScale
              });
              
              // 높은 속도에서 블록 파괴
              if (velocity > 8) {
                Matter.World.remove(engine.world, block);
                setGameState(prev => ({ ...prev, score: prev.score + 100 }));
                console.log(`💥 블록 완전 파괴! 속도: ${velocity.toFixed(2)}, 점수: +100`);
              } else {
                setGameState(prev => ({ ...prev, score: prev.score + 30 }));
                console.log(`🚀 블록 밀어냄! 속도: ${velocity.toFixed(2)}, 점수: +30`);
              }
            } else {
              setGameState(prev => ({ ...prev, score: prev.score + 10 }));
              console.log(`🔨 블록 타격! 속도: ${velocity.toFixed(2)}, 점수: +10`);
            }
          }
          
          // 블록이 돼지에 충돌 (연쇄 반응)
          if ((bodyA.label === 'block' && bodyB.label === 'pig') ||
              (bodyA.label === 'pig' && bodyB.label === 'block')) {
            const pig = bodyA.label === 'pig' ? bodyA : bodyB;
            const block = bodyA.label === 'block' ? bodyA : bodyB;
            
            // 블록의 속도가 충분히 빠르면 돼지 제거
            const velocity = Math.sqrt(block.velocity.x ** 2 + block.velocity.y ** 2);
            if (velocity > 3) {
              Matter.World.remove(engine.world, pig);
              setGameState(prev => ({ ...prev, score: prev.score + 300 }));
              console.log(`🎪 연쇄 반응! 블록이 돼지를 맞춤! 점수: +300`);
            }
          }
        });
      });
      
      // 🔥 핵심 해결: MouseConstraint를 다시 사용하되 제어 가능하게 만들기
      const mouse = Matter.Mouse.create(canvasRef.current);
      const mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.3,
          render: {
            visible: false
          }
        }
      });
      
      // 마우스 제약조건을 월드에 추가
      Matter.World.add(engine.world, mouseConstraint);
      
      // 🔥 새줄 문제 해결: 전역 드래그 상태 관리
      let isDraggingBird = false;
      let hasLaunched = false; // 발사 상태 추가
      
      // 마우스 이벤트 리스너
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Matter.Events.on(mouseConstraint, 'startdrag', (event: any) => {
        if (event.body === currentBirdRef.current) {
          isDraggingBird = true;
          console.log('🎯 새 드래그 시작!');
          
          // 🔑 핵심: 드래그 시작 시 새총 제약조건 제거
          if (slingshotConstraintRef.current) {
            Matter.World.remove(engine.world, slingshotConstraintRef.current);
            slingshotConstraintRef.current = null;
            console.log('🔓 새총 제약조건 제거됨');
          }
        }
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Matter.Events.on(mouseConstraint, 'enddrag', (event: any) => {
        if (event.body === currentBirdRef.current && isDraggingBird) {
          isDraggingBird = false;
          hasLaunched = true; // 🔥 발사 상태 설정
          console.log('🚀 새 발사!');
          
          // 🔥 문제 2 해결: 진짜 새총 탄성 효과 구현
          const birdPos = currentBirdRef.current!.position;
          const slingshotPos = { x: 150, y: 400 };
          const dx = slingshotPos.x - birdPos.x;
          const dy = slingshotPos.y - birdPos.y;
          
          // 당긴 거리 계산
          const stretchDistance = Math.sqrt(dx * dx + dy * dy);
          console.log(`🏹 새총 당긴 거리: ${stretchDistance.toFixed(2)}px`);
          
          // 🚀 극한 탄성력: 발사력 20배 증가!
          const elasticPower = Math.min(stretchDistance * 0.015, 0.4); // 20배 증가!
          
          // 정규화된 방향 벡터
          const normalizedDx = dx / stretchDistance;
          const normalizedDy = dy / stretchDistance;
          
          // 탄성력으로 발사 (당긴 방향으로 강하게!)
          const launchForceX = normalizedDx * elasticPower;
          const launchForceY = normalizedDy * elasticPower;
          
          console.log(`💪 새총 탄성력: x=${launchForceX.toFixed(4)}, y=${launchForceY.toFixed(4)}, 거리=${stretchDistance.toFixed(2)}`);
          
          // 발사 전에 새를 새총 위치로 순간 이동 (탄성 효과)
          Matter.Body.setPosition(currentBirdRef.current!, { x: slingshotPos.x, y: slingshotPos.y });
          
          // 즉시 탄성력 적용
          setTimeout(() => {
            Matter.Body.applyForce(currentBirdRef.current!, currentBirdRef.current!.position, {
              x: launchForceX,
              y: launchForceY
            });
          }, 10); // 10ms 후 발사 (탄성 효과)
          
          // 3초 후 새로운 새 생성
          setTimeout(() => {
            setGameState(prev => {
              if (prev.birdsLeft > 1) {
                console.log('🐦 새로운 새 생성');
                
                // 🔥 문제 1 해결: 이전 새를 완전히 제거
                if (currentBirdRef.current) {
                  Matter.World.remove(engine.world, currentBirdRef.current);
                  console.log('🗑️ 이전 새 제거됨');
                }
                
                const newBird = Matter.Bodies.circle(150, 400, 16, {
                  render: { fillStyle: '#FF4444' },
                  label: 'bird',
                  density: 0.05, // 극한 밀도!
                  frictionAir: 0.001, // 공기 저항 극소
                  restitution: 0.95, // 최대 튕김력
                  inertia: Infinity
                });
                
                currentBirdRef.current = newBird;
                hasLaunched = false; // 🔥 새로운 새 생성 시 새줄 다시 표시
                
                const newSlingshotConstraint = Matter.Constraint.create({
                  bodyA: slingshotPole,
                  bodyB: newBird,
                  pointA: { x: 0, y: -80 },
                  pointB: { x: 0, y: 0 },
                  stiffness: 0.05,
                  damping: 0.1,
                  length: 20
                });
                slingshotConstraintRef.current = newSlingshotConstraint;
                
                Matter.World.add(engine.world, [newBird, newSlingshotConstraint]);
                
                return { 
                  ...prev, 
                  birdsLeft: prev.birdsLeft - 1 
                };
              } else {
                return { ...prev, gameStatus: 'lost' as const };
              }
            });
          }, 3000);
        }
      });
      
      // 🎨 문제 1 해결: 완벽한 새줄 디자인 시스템
      Matter.Events.on(render, 'afterRender', () => {
        const ctx = render.canvas.getContext('2d');
        if (ctx && currentBirdRef.current && !hasLaunched) { // 🔥 발사 후에는 새줄 안 보임
          const birdPos = currentBirdRef.current.position;
          const slingshotPos = { x: 150, y: 400 };
          
          if (isDraggingBird) {
            // 🏹 당길 때: 곡선 형태의 탄성 고무줄
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            
            // 왼쪽 고무줄 (곡선)
            ctx.beginPath();
            ctx.moveTo(slingshotPos.x - 12, slingshotPos.y - 25);
            ctx.quadraticCurveTo(
              (slingshotPos.x - 12 + birdPos.x) / 2 - 20,
              (slingshotPos.y - 25 + birdPos.y) / 2,
              birdPos.x - 8,
              birdPos.y
            );
            ctx.stroke();
            
            // 오른쪽 고무줄 (곡선)
            ctx.beginPath();
            ctx.moveTo(slingshotPos.x + 12, slingshotPos.y - 25);
            ctx.quadraticCurveTo(
              (slingshotPos.x + 12 + birdPos.x) / 2 + 20,
              (slingshotPos.y - 25 + birdPos.y) / 2,
              birdPos.x + 8,
              birdPos.y
            );
            ctx.stroke();
            
            // 🚀 극한 장력 표시 (당긴 거리에 따라 강력한 시각화)
            const distance = Math.sqrt((birdPos.x - slingshotPos.x) ** 2 + (birdPos.y - slingshotPos.y) ** 2);
            const tension = Math.min(distance / 60, 1); // 더욱 민감하게 반응
            const red = Math.floor(255 * tension);
            const green = Math.floor(255 * (1 - tension));
            const blue = Math.floor(100 * tension); // 파워를 나타내는 파란색 추가
            ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
            ctx.lineWidth = Math.max(4, Math.floor(tension * 12)); // 장력에 따라 더 굵은 선
            
            // 장력 라인
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(slingshotPos.x, slingshotPos.y - 10);
            ctx.lineTo(birdPos.x, birdPos.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
          } else {
            // 🎯 평상시: 가는 실선 새줄
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            
            // 왼쪽 새줄 (일직선)
            ctx.moveTo(slingshotPos.x - 8, slingshotPos.y - 20);
            ctx.lineTo(birdPos.x - 6, birdPos.y);
            
            // 오른쪽 새줄 (일직선)
            ctx.moveTo(slingshotPos.x + 8, slingshotPos.y - 20);
            ctx.lineTo(birdPos.x + 6, birdPos.y);
            
            ctx.stroke();
          }
        }
      });
      
      // 엔진 실행
      Matter.Render.run(render);
      const runner = Matter.Runner.create();
      Matter.Runner.run(runner, engine);
    };
    
    initGame();
    
    // 클린업 함수
    return () => {
      // 클린업은 컴포넌트 언마운트 시 자동으로 처리됨
    };
  }, []); // 빈 의존성 배열로 한 번만 실행
  
  // 게임 리셋
  const resetGame = () => {
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-6xl w-full">
      {/* 게임 HUD */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-bold">
          점수: <span className="text-blue-600">{gameState.score}</span>
        </div>
        <div className="text-lg font-bold">
          남은 새: <span className="text-red-600">{gameState.birdsLeft}</span>
        </div>
        <button
          type="button"
          onClick={resetGame}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          새 게임
        </button>
      </div>

      {/* 게임 캔버스 */}
      <div className="border-4 border-gray-300 rounded-lg overflow-hidden bg-sky-300">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className="block w-full h-auto"
        />
      </div>

      {/* 게임 상태 메시지 */}
      {gameState.gameStatus !== 'playing' && (
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold mb-2">
            {gameState.gameStatus === 'won' ? '🎉 승리!' : '😢 게임 오버'}
          </div>
          <button
            type="button"
            onClick={resetGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded transition-colors"
          >
            다시 하기
          </button>
        </div>
      )}

      {/* 게임 설명 */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        🎯 <strong>극한 앵그리버드 (탄성력 20배 강화!):</strong> <br />
        🚀 <strong>극한 탄성력</strong>: 발사력 20배 증가! 새가 화면 끝까지 날아감! <br />
        ⚡ <strong>초강력 새</strong>: 밀도 50% 증가, 공기 저항 99% 감소, 크기 증가! <br />
        🎨 <strong>완벽한 새줄 시스템</strong>: 파워에 따라 RGB 색상 변화! 굵기 최대 12px! <br />
        🌟 <strong>낮은 중력</strong>: 0.3 중력으로 새가 더 멀리 포물선을 그리며 날아감! <br />
        💥 <strong>극한 파괴력</strong>: 모든 블록을 날려버리는 초강력 임펄스! <br />
        🐷 돼지 맞추면 <strong>500-700점</strong>, 블록 파괴 시 <strong>100점</strong>! <br />
        🎮 <strong>재미 극대화</strong>: 이제 정말 멀리 날아가서 재미있게 플레이! <br />
        📱 콘솔(F12)에서 극한 물리 효과를 실시간 확인 가능!
      </div>
    </div>
  );
};

export default AngryBirdsGame;