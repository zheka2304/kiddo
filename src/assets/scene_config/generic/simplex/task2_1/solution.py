import player
import console

# подойти и открыть консоль
player.move()
player.interact()

# пока в вводе есть значения
while console.has_more():
    # прочитать значение из ввода
    s = console.read()
    # если значение это пол - заменить на противоположный
    if s == u'мужчина':
        s = u'женщина'
    elif s == u'женщина':
        s = u'мужчина'
    # записать значение в вывод
    console.write(s)

# закрыть консоль
console.close()