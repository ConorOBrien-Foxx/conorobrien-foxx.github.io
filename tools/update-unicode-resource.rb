require 'open-uri'
require 'json'

UNICODE_SOURCE = "https://www.unicode.org/Public/UCD/latest/ucd/NamesList.txt"

class QueuedEnumerable
    def initialize(enum)
        @enum = enum
        @prefix = []
    end
    
    def unshift(*vals)
        @prefix.unshift *vals
    end
    
    def next
        if @prefix.empty?
            @enum.next
        else
            @prefix.shift
        end
    end
    
    def each(&blk)
        loop {
            value = self.next rescue break
            blk[value]
        }
    end
end

START_OF_LINE = /^([0-9A-F]+)\t(.+)/i
def add_entry_to_db!(iter, db)
    line = iter.next until START_OF_LINE === line
    
    return nil if line.nil?
    
    target, name = $1, $2
    alternatives = []
    
    
    loop {
        inner_line = iter.next
        if START_OF_LINE === inner_line
            iter.unshift inner_line
            break
        end
        alternatives << $1 if /\t= (.+)/ === inner_line
    }
    
    if name.start_with?("<") && !alternatives.empty?
        alternatives.push name
        name = alternatives.shift
    end
    
    dec = target.to_i(16)
    begin
        [dec].pack "U"
    rescue
        # if we cannot get the ord, why care?
        return
    end
    
    db << { hex: target, dec: dec, name: name, alts: alternatives }
end

db = []

URI.open("https://www.unicode.org/Public/UCD/latest/ucd/NamesList.txt") { |file|
    iter = QueuedEnumerable.new file.each_line
    
    loop {
        add_entry_to_db! iter, db
    }
}

File.write "unicode.json", db.to_json
