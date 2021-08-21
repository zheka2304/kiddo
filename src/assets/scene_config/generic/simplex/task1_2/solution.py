import player
import console

# дойти до двери
player.move(3)
player.left()
player.move(1)

# открыть консоль
player.interact()
# считать из ввода 2 числа
a = console.read()
b = console.read()
# записать в вывод их произведение
console.write(a * b)
# закрыть консоль
console.close()

# дойти до выхода
player.move(6)

