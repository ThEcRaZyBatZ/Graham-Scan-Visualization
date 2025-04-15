const pointArray = [];
const scaledArray = [];
const history=[];
let hull=[];
const radius = 3;
let lengthOfStack=0;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const stackCanvas=document.getElementById('stackCanvas');
const stackCtx = stackCanvas.getContext('2d');
const input = document.getElementById('userInput');
const canvasSize = 500;
canvas.width = 700;
canvas.height = 500;
const randomMax=15;
let scale = 5;
let offsetX = 0;const padding=5;
let offsetY = 0; 
let TopOfTheStack=0;
let stackYVal=0;
let stackStepVal=0;
let stackPadding=30;
class A {
  constructor(pointX, pointY) {
    this.pointX = pointX;
    this.pointY = pointY;
  }
}

function reloadPage() {
  location.reload();
}
function randomiseInput(){
  const selectedInput=document.getElementById('selectedInput');
  const n=selectedInput.selectedIndex+3;
  let s="";
  
  for(let i=0;i<n;i++){
    let randomNumberX=(Math.floor(Math.random()*2*randomMax)-randomMax);
    let randomNumberY=Math.floor(Math.random()*2*randomMax)-randomMax;
    s+=(`(${randomNumberX},${randomNumberY}) `);
  }
  console.log(s.trim());
  input.value=s.trim();
}
function setDimensions() {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pointArray.forEach(p => {
    minX = Math.min(minX, p.pointX);
    maxX = Math.max(maxX, p.pointX);
    minY = Math.min(minY, p.pointY);
    maxY = Math.max(maxY, p.pointY);
  });
  const rangeX = maxX - minX + 2 * padding;
  const rangeY = maxY - minY + 2 * padding;
  scale = Math.floor(Math.min(canvas.width / rangeX, canvas.height / rangeY));
  offsetX = -minX + padding;
  offsetY = -minY + padding;
}
function setPoints() {
  scaledArray.length = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pointArray.forEach(p => {
    const scaledX = (p.pointX + offsetX) * scale;
    const scaledY = canvas.height - (p.pointY + offsetY) * scale;
    scaledArray.push(new A(scaledX, scaledY));
    drawPoint(scaledX, scaledY);
    ctx.font = "12px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(`(${p.pointX},${p.pointY})`, scaledX + 2 * radius, scaledY - 2 * radius);
  });
}
function getInput() {
  stackCtx.clearRect(0, 0, stackCanvas.width, stackCanvas.height);
  let valArr = input.value.trim().match(/\(\s*-?\d+\s*,\s*-?\d+\s*\)/g);
  if (!valArr) {
    console.log("No valid coordinate pairs found.");
    return;
  }
  pointArray.length = 0;
  scaledArray.length = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const numberPattern = /-?\d+/g;
  valArr.forEach(pair => {
    const [x, y] = pair.match(numberPattern).map(Number);
    pointArray.push(new A(x, y));
  });
  stackYVal=0;
  stackStepVal=0;
  setDimensions();
  setPoints();
  grahamScan();
}

function drawPoint(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.stroke();
}
function drawBluePoint(x){
  ctx.beginPath();
  ctx.arc(x.pointX, x.pointY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "blue";
  ctx.fill();
  ctx.stroke();
}

function drawYellowPoint(x){
  ctx.beginPath();
  ctx.arc(x.pointX, x.pointY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.stroke();
}
function drawLine(x,y){ //point Object inputs
  ctx.beginPath();
  ctx.moveTo(x.pointX,x.pointY);
  ctx.lineTo(y.pointX,y.pointY);
  ctx.strokeStyle="white";
  ctx.stroke();
}
function Orientation(p1,p2,p3){
  let x1=p1.pointX,x2=p2.pointX,x3=p3.pointX,y1=p1.pointY,y2=p2.pointY,y3=p3.pointY;
  let orientation=(y3-y2)*(x2-x1)-(y2-y1)*(x3-x2);
  if(orientation>0) return 1; //anti clock
  else if(orientation<0) return -1; //clock
  else return 0; //collinear
}
function init(onHull,next){
  drawBluePoint(onHull);
  drawYellowPoint(next);
}
function drawLineHistory(hull){
  if(hull.length<=1) return;
  for(let i=0;i<hull.length-1;i++){
    drawLine(hull[i],hull[i+1]);
  }
}
function drawDottedBase(p){
  let y=canvas.width;
  let x=new A(padding,p.pointY);
  y=new A(y-padding,p.pointY);
  ctx.setLineDash([9, 8]);
  ctx.beginPath();
  ctx.moveTo(x.pointX,x.pointY);
  ctx.lineTo(y.pointX,y.pointY);
  ctx.strokeStyle="white";
  ctx.stroke();
  drawBluePoint(p);
  ctx.setLineDash([0]);
}
function initialiseStack(y) {
  stackCtx.clearRect(0, 0, stackCanvas.width, stackCanvas.height);
  const n = scaledArray.length;
  if (n === 0) return;
  stackCtx.beginPath();
  stackCtx.moveTo(50, y);
  stackCtx.lineTo(50, 30-20);
  stackCtx.strokeStyle = "white";
  stackCtx.stroke();
  stackCtx.beginPath();
  stackCtx.moveTo(50, y);
  stackCtx.lineTo(150, y);
  stackCtx.stroke();
  stackCtx.beginPath();
  stackCtx.moveTo(150, y);
  stackCtx.lineTo(150, 30-20);
  stackCtx.stroke();
  stackStepVal=Math.floor((y-30)/n);
  stackYVal=y+stackStepVal;
  let k = y - stackStepVal;
  for (let i = 0; i < n; i++) {
    stackCtx.beginPath();
    stackCtx.moveTo(50, k);
    stackCtx.lineTo(150, k);
    stackCtx.stroke();
    k -= stackStepVal;
  }
}
function pushToStack(p){
  stackYVal -= stackStepVal;
  stackCtx.font = "12px Arial";
  stackCtx.fillStyle = "white";
  stackCtx.fillText(`(${p.pointX},${p.pointY})`, 83, stackYVal-Math.floor(stackStepVal/2));
  console.log(stackYVal);
  
}
function popFromStack() {
  stackCtx.clearRect(83-10,stackYVal-Math.floor(stackStepVal/2)-10,70,30);
  stackYVal+=stackStepVal;
  console.log(stackYVal);
}
function grahamScan(){
  let clubbedArray=[];
  for(let i=0;i<pointArray.length;i++){
    clubbedArray.push([pointArray[i],scaledArray[i]])
  }
  function resetCanvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clubbedArray.forEach(e=>{
      drawPoint(e[1].pointX,e[1].pointY);
      ctx.font = "12px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(`(${e[0].pointX},${e[0].pointY})`, e[1].pointX + 2 * radius, e[1].pointY - 2 * radius);
    })
    drawDottedBase(min[1]);
    initialiseStack(min[1].pointY);
    setTimeout(actualGrahamAlgo,1000);
  }
  let min=[new A(Infinity,Infinity),new A(0,0)];
  clubbedArray.forEach(e => {
    if(e[0].pointY<min[0].pointY){
      min=e
    }
  });
  drawDottedBase(min[1]);
  clubbedArray.sort((a, b) => {
    const angleA = Math.atan2(a[0].pointY - min[0].pointY, a[0].pointX - min[0].pointX);
    const angleB = Math.atan2(b[0].pointY - min[0].pointY, b[0].pointX - min[0].pointX);
    if (angleA === angleB) {
      const distA = (a[0].pointX - min[0].pointX) ** 2 + (a[0].pointY - min[0].pointY) ** 2;
      const distB = (b[0].pointX - min[0].pointX) ** 2 + (b[0].pointY - min[0].pointY) ** 2;
      return distA - distB;
    }
    return angleA - angleB;
  });
  let i=0;
  function step(){
    if(i==clubbedArray.length){
      setTimeout(resetCanvas,500);
      return;
    } 
    drawLine(clubbedArray[i][1],min[1]);
    i++;
    setTimeout(step,400);
  }
  step();
  function removeEverything(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clubbedArray.forEach(e=>{
      drawPoint(e[1].pointX,e[1].pointY);
      ctx.font = "12px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(`(${e[0].pointX},${e[0].pointY})`, e[1].pointX + 2 * radius, e[1].pointY - 2 * radius);
    })
    drawDottedBase(min[1]);
  }
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async function actualGrahamAlgo() {
    let hull=[];
    let otherHull=[];
    for(let i=0;i<clubbedArray.length;i++){
      while(hull.length>=2){
        if(Orientation(hull[hull.length-2],hull[hull.length-1],clubbedArray[i][0])!=1){
          ctx.beginPath();
          ctx.moveTo(otherHull[otherHull.length - 2].pointX, otherHull[otherHull.length - 2].pointY);
          ctx.lineTo(otherHull[otherHull.length - 1].pointX, otherHull[otherHull.length - 1].pointY);
          ctx.lineTo((clubbedArray[i][1]).pointX, (clubbedArray[i][1]).pointY);
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.lineWidth = 1;
          await sleep(600);
          hull.pop();
          otherHull.pop();
          popFromStack();
          removeEverything();
          drawLineHistory(otherHull);
          await sleep(600);
        }
        else{
          break;
        }
      }

      hull.push(clubbedArray[i][0]);
      otherHull.push(clubbedArray[i][1]);
      pushToStack(clubbedArray[i][0]);
      removeEverything();
      drawLineHistory(otherHull);
      await sleep(600);
    }
    if (otherHull.length >= 2) {
      drawLine(otherHull[otherHull.length - 1], otherHull[0]);
    }
  }
}


