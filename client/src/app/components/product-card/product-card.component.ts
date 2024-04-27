import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserServiceService } from '../../services/user/user-service.service';
import Swal from 'sweetalert2';
import { LocalStorageService } from '../../services/local-storage.service';


@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterModule],
  providers: [UserServiceService, LocalStorageService],
  templateUrl: './product-card.component.html',
  styles: ``
})
export class ProductCardComponent {
  @Input() product: any;
  wishListBtn = false;

  constructor(private userService: UserServiceService, private localStorage: LocalStorageService) { }

  addToCart() {
    console.log(this.product._id);
    if (!this.product.stock) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'There is no enough quantity in the stock!',
      });
      return;
    }
    this.userService.addCart(this.product._id).subscribe({
      next: (data) => { },
      error: (error) => console.error(error)
    });
    Swal.fire({
      icon: 'success',
      title: 'Great!',
      text: 'Product Added To Your Cart Successfully'
    })
  }

  addProductToWishList() {
    let products: any;
    if (this.localStorage.getItem('wishList')) {
      products = this.localStorage.getItem('wishList');
      if (products.some((prod: any) => prod._id === this.product._id)) {
        products = products.filter((prod: any) => prod._id !== this.product._id);
      } else {
        products.push(this.product)
      }
      this.localStorage.setItem('wishList', products);
    } else {
      products = [];
      products.push(this.product);
      this.localStorage.setItem('wishList', products);
    }
  }
}
