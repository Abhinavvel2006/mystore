import { createContext, useState } from "react";
export const CartContext = createContext();

export function CartProvider({ children}){
    const [cart, setCart] = useState([]);

    function addToCart(product) {
        const exist = cart.find(
            item => item.id === product.id
        );
        if (exist){
            setCart(
                cart.map(item =>
                    item.id === product.id
                    ?{
                        ...item,
                        quantity: item.quantity + 1
                    }
                    : item 
                )
            );
        }
        else{
            setCart([
                ...cart,
                {
                    ...product,
                    quantity: 1
                }
            ]);
        }
    }

    function increaseQuantity(productId) {
        setCart(currentCart =>
            currentCart.map(item =>
                item.id === productId
                    ? {
                        ...item,
                        quantity: item.quantity + 1
                    }
                    : item
            )
        );
    }

    function decreaseQuantity(productId) {
        setCart(currentCart =>
            currentCart
                .map(item =>
                    item.id === productId
                        ? {
                            ...item,
                            quantity: item.quantity - 1
                        }
                        : item
                )
                .filter(item => item.quantity > 0)
        );
    }

    function remove(productId) { 
        setCart(currentCart => currentCart.filter(item => item.id !== productId));
    }

    function clearCart() {
        setCart([]);
    }

    return(
        <CartContext.Provider 
            value={{
                cart,
                addToCart,
                increaseQuantity,
                decreaseQuantity,
                remove,
                clearCart
            }}
            >

            {children}

            </CartContext.Provider>
    );
}
