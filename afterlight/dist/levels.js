export const TILE = 40;
export const WIDTH = 960;
export const HEIGHT = 640;
const r = (x,y,w,h) => ({x:x*TILE,y:y*TILE,w:w*TILE,h:h*TILE});
const p = (x,y) => ({x:(x+.5)*TILE,y:(y+.5)*TILE});
const edges = [r(0,0,24,1),r(0,15,24,1),r(0,1,1,14),r(23,1,1,14)];
const wall = (...values) => values.map(v=>r(...v));
const plate = (id,x,y) => ({id,...p(x,y)});
const gate = (id,x,y,w,h,needs) => ({id,...r(x,y,w,h),needs});
const drone = (points,speed=65,phase=0) => ({points:points.map(v=>p(...v)),speed,phase});
const laser = (x1,y1,x2,y2,period=5,on=2.5,phase=0) => ({a:p(x1,y1),b:p(x2,y2),period,on,phase});
export const LEVELS = [
  {
    id:'first-echo',name:'The first echo',kicker:'LEARN TO LEAVE A TRACE',difficulty:'Initiation',time:20,par:38,
    brief:'Your past is your partner. Leave an echo on switch A to open the vault.',
    hint:'Move onto A and press Space. Your echo will replay the route and stay on A. Then cross the open gate, collect all three light shards, and reach OUT.',
    route:['Record switch A','Rewind & cross the gate','Take 3 shards. Get out.'],
    spawn:p(3,8),exit:p(21,8),plates:[plate('A',7,11)],
    walls:[...edges,...wall([13,1,1,5],[13,10,1,5],[5,4,5,1],[5,5,1,2],[17,7,2,1],[17,9,2,1])],
    gates:[gate('I',13,6,1,4,['A'])],shards:[p(17,4),p(20,8),p(17,12)],drones:[],lasers:[]
  },
  {
    id:'crossed-signals',name:'Crossed signals',kicker:'TWO PLACES AT ONCE',difficulty:'Low security',time:22,par:65,
    brief:'Two switches. One gate. You will need two versions of yourself.',
    hint:'Record an echo on A, then a second on B. Both echoes must reach their switches before the vault gate opens. Red patrols follow a fixed route; Shift dashes safely through them.',
    route:['Leave an echo on A','Leave another on B','Slip past the patrol'],
    spawn:p(3,8),exit:p(21,8),plates:[plate('A',5,3),plate('B',6,12)],
    walls:[...edges,...wall([12,1,1,6],[12,9,1,6],[8,6,1,4],[18,6,2,1],[18,10,2,1])],
    gates:[gate('II',12,7,1,2,['A','B'])],shards:[p(17,3),p(20,8),p(17,12)],
    drones:[drone([[15,3],[15,12]],70),drone([[21,3],[21,12]],52,2)],lasers:[]
  },
  {
    id:'borrowed-seconds',name:'Borrowed seconds',kicker:'BUILD A CHAIN REACTION',difficulty:'Restricted',time:25,par:80,
    brief:'The second switch is behind the first gate. Make your echoes work in sequence.',
    hint:'Leave the first echo on A. On your next loop, cross gate I and record an echo on B. Rewind again, follow the chain, and clear the inner vault.',
    route:['Echo A opens gate I','Echo B opens gate II','Follow your past inside'],
    spawn:p(3,6),exit:p(21,9),plates:[plate('A',5,12),plate('B',13,3)],
    walls:[...edges,...wall([9,1,1,4],[9,8,1,7],[16,1,1,8],[16,12,1,3],[11,7,3,1],[19,7,2,1])],
    gates:[gate('I',9,5,1,3,['A']),gate('II',16,9,1,3,['B'])],shards:[p(12,11),p(20,4),p(21,12)],
    drones:[drone([[11,5],[14,5]],60),drone([[18,11],[21,11]],85)],lasers:[]
  },
  {
    id:'ghost-protocol',name:'Ghost protocol',kicker:'FIND THE SAFE MOMENT',difficulty:'High security',time:24,par:80,
    brief:'The archive is watching. Time your crossing, or dash through the laser grid.',
    hint:'Record switches A and B above the central wall. The lasers alternate between active red and a dim safe phase. A dash protects you from patrols and beams for a short burst.',
    route:['Record A and B','Watch the laser cycle','Dash into the lower vault'],
    spawn:p(3,4),exit:p(20,12),plates:[plate('A',19,3),plate('B',6,6)],
    walls:[...edges,...wall([1,8,8,1],[13,8,10,1],[12,2,1,3],[5,11,4,1],[16,11,1,3])],
    gates:[gate('III',9,8,4,1,['A','B'])],shards:[p(3,13),p(12,12),p(20,10)],
    drones:[drone([[8,3],[10,6]],65),drone([[10,10],[14,13]],70)],
    lasers:[laser(9,10,13,10,5,2.2,1),laser(18,11,22,11,4.6,2.1,.5)]
  },
  {
    id:'three-body',name:'Three-body problem',kicker:'A CREW OF ONE',difficulty:'Maximum security',time:26,par:100,
    brief:'Three switches must stay active. Fill all three echo slots to break the seal.',
    hint:'Use all three echoes: one on A, one on B, and one on C. When a recording finishes, its echo holds the final position. A fourth rewind replaces the oldest echo.',
    route:['Anchor A, B, and C','Keep all 3 echoes active','Break the triple seal'],
    spawn:p(3,8),exit:p(21,8),plates:[plate('A',4,3),plate('B',11,3),plate('C',7,12)],
    walls:[...edges,...wall([16,1,1,6],[16,10,1,5],[8,1,1,6],[11,9,2,4],[19,6,2,1],[19,10,2,1])],
    gates:[gate('IV',16,7,1,3,['A','B','C'])],shards:[p(20,3),p(19,8),p(20,13)],
    drones:[drone([[3,10],[9,10]],70),drone([[18,3],[18,13]],80),drone([[21,7],[21,9]],55)],
    lasers:[laser(9,5,14,5,5.6,2.2,2)]
  },
  {
    id:'last-light',name:'The last light',kicker:'MAKE EVERY SECOND COUNT',difficulty:'The final heist',time:36,par:135,
    brief:'Three sequential gates. An entire timeline working together. Steal the last light.',
    hint:'Build the sequence: A opens the first gate, B the second, C the third. Wait for your echoes at each gate, then use the long final loop to collect every shard and extract.',
    route:['Build the A → B → C chain','Follow your three echoes','Take the last light home'],
    spawn:p(3,11),exit:p(21,3),plates:[plate('A',3,3),plate('B',10,12),plate('C',15,3)],
    walls:[...edges,...wall([7,1,1,8],[7,12,1,3],[13,1,1,2],[13,6,1,9],[18,1,1,8],[18,12,1,3],[2,7,3,1],[9,7,2,1],[15,7,2,1])],
    gates:[gate('I',7,9,1,3,['A']),gate('II',13,3,1,3,['B']),gate('III',18,9,1,3,['C'])],
    shards:[p(21,13),p(20,8),p(21,4)],
    drones:[drone([[9,9],[11,12]],60),drone([[15,9],[16,13]],65),drone([[20,6],[22,6]],80)],
    lasers:[laser(19,10,22,10,5.2,2.2,1.5),laser(19,5,22,5,4.5,2,2.6)]
  }
];
