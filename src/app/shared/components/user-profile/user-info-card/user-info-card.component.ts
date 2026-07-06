import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-user-info-card',
  imports: [],
  templateUrl: './user-info-card.component.html',
  styles: ``
})
export class UserInfoCardComponent {
  @Input() user: any = {};
}
