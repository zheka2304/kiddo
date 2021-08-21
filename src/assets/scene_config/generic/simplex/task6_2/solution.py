import player
import console


# идти вперед, подобрать письмо, идти вперед
player.move()
player.pickup('letter')
player.move()

# положить письмо перед собой, открыть его
player.place('letter', 0, 1)
player.interact()


# инициализировать переменную с текстом письма пустой строкой
text = ""

# пока в вводе консоли остались строки
while console.has_more():
    # прочитать и добавить к тексту письма следующую строку
    text += console.read()
    # если это была не последняя строка, добавить перенос строки
    if console.has_more():
        text += "\n"

# вывести результат и закрыть консоль
console.write(text)
console.close()