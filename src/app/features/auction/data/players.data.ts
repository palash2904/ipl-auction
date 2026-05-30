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
  'Vaibhav Suryavanshi',
  'Sai Sudharsan',
  'Anshul Kamboj',
  'Rajat Patidar',
  'Prasidh Krishna',
  'Shikhar Dhawan',
  'Suresh Raina',
  'Khaleel Ahmed',
  'Sandeep Sharma',
  'Tushar Deshpande',
]);

const setDefinitions = [
  ['MARQUEE LEGENDS', ['MS Dhoni', 'Virat Kohli', 'Rohit Sharma', 'AB de Villiers', 'Chris Gayle', 'Lasith Malinga']],
  ['MARQUEE LEGENDS', ['Jasprit Bumrah', 'Rashid Khan', 'Pat Cummins', 'Glenn Maxwell', 'Ben Stokes', 'Hardik Pandya']],
  ['CAPPED BATTERS A', ['Shubman Gill', 'Jos Buttler', 'Yashasvi Jaiswal', 'Travis Head', 'Suryakumar Yadav', 'David Warner', 'KL Rahul', 'Aaron Finch', 'Shreyas Iyer', 'Vaibhav Suryavanshi', 'Faf du Plessis', 'Sai Sudharsan']],
  ['CAPPED BATTERS B', ['Ruturaj Gaikwad', 'Quinton de Kock', 'Rishabh Pant', 'Kane Williamson', 'Sanju Samson', 'Paul Stirling', 'Shimron Hetmyer', 'Tilak Varma', 'Alex Hales', 'Devdutt Padikkal', 'Rajat Patidar', 'Shikhar Dhawan', 'Suresh Raina']],
  ['CAPPED ALL-ROUNDERS A', ['Ravindra Jadeja', 'Dwayne Bravo', 'Axar Patel', 'Kieron Pollard', 'Shardul Thakur', 'Shane Watson', 'Washington Sundar', 'Andre Russell', 'Venkatesh Iyer']],
  ['CAPPED ALL-ROUNDERS B', ['Moeen Ali', 'Shivam Dube', 'Sam Curran', 'Krunal Pandya', 'Marcus Stoinis', 'Vijay Shankar', 'Mitchell Marsh', 'Liam Livingstone', 'Jamie Overton']],
  ['CAPPED WK-BATTERS', ['Ishan Kishan', 'Nicholas Pooran', 'Dinesh Karthik', 'Jonny Bairstow', 'Wriddhiman Saha', 'Heinrich Klaasen', 'Tim David', 'Alex Carey', 'Phil Salt']],
  ['CAPPED FAST BOWLERS A', ['Mohammed Shami', 'Mitchell Starc', 'Mohammed Siraj', 'Josh Hazlewood', 'Arshdeep Singh', 'Trent Boult', 'Deepak Chahar', 'Kagiso Rabada', 'Anshul Kamboj', 'Prasidh Krishna']],
  ['CAPPED FAST BOWLERS B', ['Bhuvneshwar Kumar', 'Anrich Nortje', 'Umesh Yadav', 'Mark Wood', 'Navdeep Saini', 'Lockie Ferguson', 'Avesh Khan', 'Mustafizur Rahman', 'Alzarri Joseph', 'Khaleel Ahmed', 'Sandeep Sharma', 'Tushar Deshpande']],
  ['CAPPED SPINNERS A', ['Yuzvendra Chahal', 'Sunil Narine', 'Kuldeep Yadav', 'Imran Tahir', 'Ravichandran Ashwin', 'Adam Zampa', 'Amit Mishra', 'Maheesh Theekshana']],
  ['CAPPED SPINNERS B', ['Piyush Chawla', 'Wanindu Hasaranga', 'Rahul Chahar', 'Prabath Jayasuriya', 'Varun Chakravarthy', 'Noor Ahmed', 'Ravi Bishnoi']],
] as const;

const roleOverrides = new Map<string, string>([
  ['MS Dhoni', 'WK-Batter'],
  ['AB de Villiers', 'WK-Batter'],
  ['KL Rahul', 'WK-Batter'],
  ['Sanju Samson', 'WK-Batter'],
  ['Rishabh Pant', 'WK-Batter'],
  ['Quinton de Kock', 'WK-Batter'],
  ['Lasith Malinga', 'Fast Bowler'],
  ['Jasprit Bumrah', 'Fast Bowler'],
  ['Rashid Khan', 'Spinner'],
  ['Pat Cummins', 'Fast Bowler'],
  ['Glenn Maxwell', 'All-rounder'],
  ['Ben Stokes', 'All-rounder'],
  ['Hardik Pandya', 'All-rounder'],
]);

const roleForSet = (setNumber: number): string => {
  if ([5, 6].includes(setNumber)) return 'All-rounder';
  if (setNumber === 7) return 'WK-Batter';
  if ([8, 9].includes(setNumber)) return 'Fast Bowler';
  if ([10, 11].includes(setNumber)) return 'Spinner';
  return 'Batter';
};

const basePriceForSet = (setNumber: number): number => {
  if ([1, 2].includes(setNumber)) return 2;
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
      const role = roleOverrides.get(name) ?? roleForSet(setNumber);
      const player: Player = {
        id: `set-${setNumber}-${playerIndex + 1}`,
        name,
        role,
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
          runs: role === 'Fast Bowler' || role === 'Spinner' ? undefined : 1200 + playerIndex * 281,
          wickets: role === 'Batter' || role === 'WK-Batter' ? undefined : 45 + playerIndex * 13,
        },
      };
      return player;
    }),
  };
});

export const AUCTION_PLAYERS: Player[] = AUCTION_SETS.flatMap((set) => set.players);
