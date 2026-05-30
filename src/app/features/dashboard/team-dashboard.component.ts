import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AuctionStore } from '../../core/services/auction-store.service';
import { Franchise, Player } from '../../models/auction.models';
import { CrorePipe } from '../../shared/pipes/crore.pipe';

interface SquadAnalysis {
  franchise: Franchise;
  players: Player[];
  rank: number;
  overallRating: number;
  battingRating: number;
  bowlingRating: number;
  allRounderRating: number;
  wicketkeeperRating: number;
  depthRating: number;
  balanceRating: number;
  strengths: string[];
  weaknesses: string[];
  playingXi: Player[];
  captain: Player | null;
  viceCaptain: Player | null;
  battingOrder: Player[];
  bowlingOptions: Player[];
  deathSpecialists: Player[];
  impactPlayers: Player[];
  combination: string;
}

interface SquadScoreBreakdown {
  battingRating: number;
  bowlingRating: number;
  allRounderRating: number;
  wicketkeeperRating: number;
  depthRating: number;
  balanceRating: number;
}

@Component({
  selector: 'app-team-dashboard',
  standalone: true,
  imports: [CommonModule, CrorePipe],
  templateUrl: './team-dashboard.component.html',
})
export class TeamDashboardComponent {
  protected readonly store = inject(AuctionStore);
  protected readonly squadAnalysis = computed(() => this.buildSquadAnalysis());
  protected readonly bestSquad = computed(() => this.squadAnalysis()[0] ?? null);

  roleCount(team: Franchise, role: string): number {
    return this.store.playersForTeam(team.id).filter((player) => player.role === role).length;
  }

  private buildSquadAnalysis(): SquadAnalysis[] {
    const analyses = this.store.state().franchises.map((franchise) => {
      const players = this.store.playersForTeam(franchise.id);
      const playingXi = this.pickPlayingXi(players);
      const battingOrder = this.buildBattingOrder(playingXi);
      const bowlingOptions = playingXi
        .filter((player) => ['Fast Bowler', 'Spinner', 'All-rounder'].includes(player.role))
        .sort((a, b) => this.playerRating(b) - this.playerRating(a));
      const deathSpecialists = bowlingOptions
        .filter((player) => player.role === 'Fast Bowler' || player.role === 'All-rounder')
        .slice(0, 2);
      const [captain, viceCaptain] = [...playingXi].sort((a, b) => this.leadershipScore(b) - this.leadershipScore(a));
      const battingRating = this.roleRating(players, ['Batter', 'WK-Batter', 'All-rounder']);
      const bowlingRating = this.roleRating(players, ['Fast Bowler', 'Spinner', 'All-rounder']);
      const allRounderRating = this.roleRating(players, ['All-rounder']);
      const wicketkeeperRating = this.roleRating(players, ['WK-Batter']);
      const depthRating = this.depthRating(players, playingXi);
      const balanceRating = this.balanceRating(players);
      const overallRating = Math.round(
        battingRating * 0.25 +
          bowlingRating * 0.25 +
          allRounderRating * 0.16 +
          wicketkeeperRating * 0.1 +
          depthRating * 0.1 +
          balanceRating * 0.14,
      );

      return {
        franchise,
        players,
        rank: 0,
        overallRating,
        battingRating,
        bowlingRating,
        allRounderRating,
        wicketkeeperRating,
        depthRating,
        balanceRating,
        strengths: this.strengthsFor({
          battingRating,
          bowlingRating,
          allRounderRating,
          wicketkeeperRating,
          depthRating,
          balanceRating,
        }),
        weaknesses: this.weaknessesFor(players, {
          battingRating,
          bowlingRating,
          allRounderRating,
          wicketkeeperRating,
          depthRating,
          balanceRating,
        }),
        playingXi,
        captain: captain ?? null,
        viceCaptain: viceCaptain ?? null,
        battingOrder,
        bowlingOptions,
        deathSpecialists,
        impactPlayers: [...playingXi].sort((a, b) => this.playerRating(b) - this.playerRating(a)).slice(0, 4),
        combination: this.combinationFor(playingXi),
      };
    });

    return analyses
      .sort((a, b) => b.overallRating - a.overallRating)
      .map((analysis, index) => ({ ...analysis, rank: index + 1 }));
  }

  private pickPlayingXi(players: Player[]): Player[] {
    const selected: Player[] = [];
    const sorted = [...players].sort((a, b) => this.playerRating(b) - this.playerRating(a));
    const add = (candidates: Player[], count: number) => {
      for (const player of candidates) {
        if (selected.length >= 11 || selected.includes(player)) continue;
        if (selected.filter((item) => item.overseas).length >= 4 && player.overseas) continue;
        selected.push(player);
        if (selected.filter((item) => candidates.includes(item)).length >= count) break;
      }
    };

    add(sorted.filter((player) => player.role === 'WK-Batter'), 1);
    add(sorted.filter((player) => player.role === 'Batter'), 4);
    add(sorted.filter((player) => player.role === 'All-rounder'), 2);
    add(sorted.filter((player) => player.role === 'Fast Bowler'), 3);
    add(sorted.filter((player) => player.role === 'Spinner'), 1);
    add(sorted, 11);

    return selected.slice(0, 11);
  }

  private buildBattingOrder(players: Player[]): Player[] {
    const orderPriority = new Map<string, number>([
      ['Batter', 1],
      ['WK-Batter', 2],
      ['All-rounder', 3],
      ['Spinner', 4],
      ['Fast Bowler', 5],
    ]);

    return [...players].sort((a, b) => {
      const roleDiff = (orderPriority.get(a.role) ?? 6) - (orderPriority.get(b.role) ?? 6);
      return roleDiff || this.playerRating(b) - this.playerRating(a);
    });
  }

  private roleRating(players: Player[], roles: string[]): number {
    const rolePlayers = players.filter((player) => roles.includes(player.role));
    if (!rolePlayers.length) return 0;
    const topScores = rolePlayers
      .map((player) => this.playerRating(player))
      .sort((a, b) => b - a)
      .slice(0, 5);
    return Math.min(100, Math.round(topScores.reduce((total, score) => total + score, 0) / Math.max(1, topScores.length)));
  }

  private depthRating(players: Player[], playingXi: Player[]): number {
    const bench = players.filter((player) => !playingXi.includes(player));
    if (!bench.length) return players.length >= 11 ? 55 : Math.round(players.length * 5);
    const benchQuality = bench.reduce((total, player) => total + this.playerRating(player), 0) / bench.length;
    return Math.min(100, Math.round(benchQuality * 0.75 + Math.min(25, bench.length * 4)));
  }

  private balanceRating(players: Player[]): number {
    const targets = [
      ['Batter', 4],
      ['WK-Batter', 1],
      ['All-rounder', 2],
      ['Fast Bowler', 3],
      ['Spinner', 1],
    ] as const;
    const coverage = targets.reduce((total, [role, target]) => {
      const count = players.filter((player) => player.role === role).length;
      return total + Math.min(1, count / target);
    }, 0);
    const overseasBalance = Math.min(1, players.filter((player) => player.overseas).length / 4);
    return Math.round(((coverage / targets.length) * 0.85 + overseasBalance * 0.15) * 100);
  }

  private playerRating(player: Player): number {
    const stats = player.stats ?? {};
    const runScore = Math.min(28, (stats.runs ?? 0) / 180);
    const wicketScore = Math.min(28, (stats.wickets ?? 0) / 6);
    const matchScore = Math.min(18, (stats.matches ?? 0) / 10);
    const priceScore = Math.min(18, player.soldPrice * 4);
    const roleBonus = player.role === 'All-rounder' ? 8 : player.role === 'WK-Batter' ? 5 : 3;
    return Math.min(100, Math.round(runScore + wicketScore + matchScore + priceScore + roleBonus));
  }

  private leadershipScore(player: Player): number {
    const roleBoost = ['Batter', 'WK-Batter', 'All-rounder'].includes(player.role) ? 10 : 0;
    return this.playerRating(player) + roleBoost + (player.stats?.matches ?? 0) / 12;
  }

  private strengthsFor(scores: SquadScoreBreakdown): string[] {
    const labels: Record<string, string> = {
      battingRating: 'Top-order and run-scoring core',
      bowlingRating: 'Wicket-taking bowling attack',
      allRounderRating: 'Flexible all-rounder group',
      wicketkeeperRating: 'Reliable wicketkeeper option',
      depthRating: 'Strong bench and backup quality',
      balanceRating: 'Balanced role coverage',
    };
    return Object.entries(scores)
      .filter(([, score]) => score >= 70)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => labels[key])
      .slice(0, 3);
  }

  private weaknessesFor(players: Player[], scores: SquadScoreBreakdown): string[] {
    const weaknesses: string[] = [];
    if (scores.battingRating < 55) weaknesses.push('Needs more proven batting firepower');
    if (scores.bowlingRating < 55) weaknesses.push('Bowling attack lacks depth');
    if (scores.allRounderRating < 55) weaknesses.push('Few multi-skill options');
    if (scores.wicketkeeperRating < 55) weaknesses.push('Wicketkeeper coverage is thin');
    if (scores.depthRating < 55) weaknesses.push('Bench depth could be exposed');
    if (players.length < 11) weaknesses.push('Squad is short of a full Playing XI');
    return weaknesses.length ? weaknesses.slice(0, 3) : ['No major gap; selection depends on matchups'];
  }

  private combinationFor(players: Player[]): string {
    const count = (role: string) => players.filter((player) => player.role === role).length;
    return `${count('Batter')} batters, ${count('WK-Batter')} WK, ${count('All-rounder')} all-rounders, ${count('Fast Bowler')} pacers, ${count('Spinner')} spinners`;
  }
}
