import { AuctionSet, Player } from '../../../models/auction.models';

const indianNames = new Set([
  'MS Dhoni',
  'Virat Kohli',
  'Rohit Sharma',
  'Jasprit Bumrah',
  'Hardik Pandya',
  'Shubman Gill',
  'Yashasvi Jaiswal',
  'Suryakumar Yadav',
  'KL Rahul',
  'Shreyas Iyer',
  'Ruturaj Gaikwad',
  'Rishabh Pant',
  'Sanju Samson',
  'Tilak Varma',
  'Devdutt Padikkal',
  'Ravindra Jadeja',
  'Axar Patel',
  'Shardul Thakur',
  'Washington Sundar',
  'Venkatesh Iyer',
  'Shivam Dube',
  'Krunal Pandya',
  'Vijay Shankar',
  'Ishan Kishan',
  'Dinesh Karthik',
  'Wriddhiman Saha',
  'Mohammed Shami',
  'Mohammed Siraj',
  'Arshdeep Singh',
  'Deepak Chahar',
  'Bhuvneshwar Kumar',
  'Umesh Yadav',
  'Navdeep Saini',
  'Avesh Khan',
  'Yuzvendra Chahal',
  'Kuldeep Yadav',
  'Ravichandran Ashwin',
  'Amit Mishra',
  'Piyush Chawla',
  'Rahul Chahar',
  'Varun Chakravarthy',
  'Ravi Bishnoi',
  'Sachin Tendulkar',
  'Sourav Ganguly',
  'Rahul Dravid',
  'VVS Laxman',
  'Anil Kumble',
  'Harbhajan Singh',
  'Zaheer Khan',
  'Yuvraj Singh',
  'Gautam Gambhir',
  'Virendra Sehwag',
]);

const setDefinitions = [
  ['MARQUEE LEGENDS', ['MS Dhoni', 'Virat Kohli', 'Rohit Sharma', 'AB de Villiers', 'Chris Gayle', 'Lasith Malinga']],
  ['MARQUEE LEGENDS', ['Jasprit Bumrah', 'Rashid Khan', 'Pat Cummins', 'Glenn Maxwell', 'Ben Stokes', 'Hardik Pandya']],
  ['CAPPED BATTERS (Indian)', ['Shubman Gill', 'Yashasvi Jaiswal', 'Suryakumar Yadav', 'KL Rahul', 'Shreyas Iyer', 'Ruturaj Gaikwad', 'Rishabh Pant', 'Sanju Samson', 'Tilak Varma', 'Devdutt Padikkal']],
  ['CAPPED BATTERS (Overseas)', ['Jos Buttler', 'Travis Head', 'David Warner', 'Aaron Finch', 'Babar Azam', 'Faf du Plessis', 'Quinton de Kock', 'Kane Williamson', 'Paul Stirling', 'Alex Hales']],
  ['CAPPED ALL-ROUNDERS (Indian)', ['Ravindra Jadeja', 'Axar Patel', 'Shardul Thakur', 'Washington Sundar', 'Venkatesh Iyer', 'Shivam Dube', 'Krunal Pandya', 'Vijay Shankar']],
  ['CAPPED ALL-ROUNDERS (Overseas)', ['Dwayne Bravo', 'Kieron Pollard', 'Shane Watson', 'Andre Russell', 'Moeen Ali', 'Sam Curran', 'Marcus Stoinis', 'Mitchell Marsh', 'Liam Livingstone', 'Shimron Hetmyer']],
  ['CAPPED WK-BATTERS', ['Ishan Kishan', 'Dinesh Karthik', 'Wriddhiman Saha', 'Nicholas Pooran', 'Jonny Bairstow', 'Heinrich Klaasen', 'Tim David', 'Alex Carey']],
  ['CAPPED FAST BOWLERS (Indian)', ['Mohammed Shami', 'Mohammed Siraj', 'Arshdeep Singh', 'Deepak Chahar', 'Bhuvneshwar Kumar', 'Umesh Yadav', 'Navdeep Saini', 'Avesh Khan']],
  ['CAPPED FAST BOWLERS (Overseas)', ['Mitchell Starc', 'Josh Hazlewood', 'Trent Boult', 'Kagiso Rabada', 'Anrich Nortje', 'Mark Wood', 'Lockie Ferguson', 'Mustafizur Rahman', 'Alzarri Joseph', 'Akeal Hosein']],
  ['CAPPED SPINNERS (Indian)', ['Yuzvendra Chahal', 'Kuldeep Yadav', 'Ravichandran Ashwin', 'Amit Mishra', 'Piyush Chawla', 'Rahul Chahar', 'Varun Chakravarthy', 'Ravi Bishnoi']],
  ['CAPPED SPINNERS (Overseas)', ['Sunil Narine', 'Imran Tahir', 'Adam Zampa', 'Maheesh Theekshana', 'Wanindu Hasaranga', 'Prabath Jayasuriya']],
  ['HALL OF FAME LEGENDS', ['Sachin Tendulkar', 'Sourav Ganguly', 'Rahul Dravid', 'VVS Laxman', 'Anil Kumble', 'Harbhajan Singh', 'Zaheer Khan', 'Yuvraj Singh', 'Gautam Gambhir', 'Virendra Sehwag', 'Brett Lee', 'Shaun Pollock', 'Muttiah Muralitharan', 'Shoaib Akhtar', 'Daniel Vettori']],
] as const;

const roleForSet = (setNumber: number): string => {
  if ([5, 6].includes(setNumber)) return 'All-rounder';
  if (setNumber === 7) return 'WK-Batter';
  if ([8, 9].includes(setNumber)) return 'Fast Bowler';
  if ([10, 11].includes(setNumber)) return 'Spinner';
  return 'Batter';
};

const basePriceForSet = (setNumber: number): number => {
  if ([1, 2, 12].includes(setNumber)) return 2;
  if ([3, 4, 5, 6, 7].includes(setNumber)) return 1.5;
  return 1;
};

export const AUCTION_SETS: AuctionSet[] = setDefinitions.map(([title, names], setIndex) => {
  const setNumber = setIndex + 1;
  return {
    setNumber,
    title: `SET ${setNumber} - ${title}`,
    players: names.map((name, playerIndex) => {
      const overseas = !indianNames.has(name);
      const player: Player = {
        id: `set-${setNumber}-${playerIndex + 1}`,
        name,
        role: roleForSet(setNumber),
        nationality: overseas ? 'Overseas' : 'India',
        overseas,
        basePrice: basePriceForSet(setNumber),
        soldPrice: 0,
        soldTo: null,
        status: 'available',
        setNumber,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=101827&color=f8c94a&bold=true&size=256`,
        stats: {
          matches: 80 + ((setNumber * 11 + playerIndex * 7) % 190),
          runs: roleForSet(setNumber) === 'Fast Bowler' || roleForSet(setNumber) === 'Spinner' ? undefined : 1200 + playerIndex * 281,
          wickets: roleForSet(setNumber) === 'Batter' || roleForSet(setNumber) === 'WK-Batter' ? undefined : 45 + playerIndex * 13,
        },
      };
      return player;
    }),
  };
});

export const AUCTION_PLAYERS: Player[] = AUCTION_SETS.flatMap((set) => set.players);
