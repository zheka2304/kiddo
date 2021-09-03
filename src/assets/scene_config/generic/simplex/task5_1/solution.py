import player
import console

# подойти и открыть консоль
player.move()
player.interact()

# пока в вводе есть значения
while console.has_more():
    # прочитать значение из ввода
    s = console.read()
    # заменить все требуемые подстроки
    s = s.replace(u'ТЧК', '.')
    s = s.replace(u'ЗПТ', ',')
    s = s.replace(u'ВОСКЛИЦАТЕЛЬНЫЙ_ЗНАК', '!')
    s = s.replace(u'_', ' ')
    # записать значение в вывод
    console.write(s)

# закрыть консоль
console.close()