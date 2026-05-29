import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'crore',
  standalone: true,
})
export class CrorePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const amount = Number(value ?? 0);
    return `Rs ${amount.toFixed(amount % 1 === 0 ? 0 : 2)} Cr`;
  }
}
